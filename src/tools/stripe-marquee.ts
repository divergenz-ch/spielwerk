import { evaluateStripeMarquee } from '../engine/client';
import type { Frame, ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, dimensions, artboard } from './arrow-path';
import { svgArtwork } from './svg-artwork';
export type StripeScene = { svg: string; staticSvg: string; columns: number; tile: number[] };
export const adapter: ToolAdapter<Parameters, StripeScene> = {
  id: 'stripe-marquee',
  // Large, readable PLAY lettering woven from peach, lilac and butter stripes.
  defaults: {
    text: 'PLAY', fontsize: 32, fit: 'fit width', lineh: 145, xscale: 100, yscale: 100, basex: 0, basey: 0, track: 0, gapx: 18,
    motion: 'up', secs: 16, rows: 88, rowgap: 8, rowphase: 0, rowlag: 0, skew: -12, stagger: 0,
    seed: 219, depth: 7, jitter: 25, minw: 0.3, scale: 'uniform', ink0: 5, ink1: 100, contrast: 180, levels: 1,
    paper: '#201b32', c1: '#ff8761', c2: '#e9b8e8', c3: '#f8db8a', blend: 'normal', fps: 20, gifpx: 600, rel: 1, wpx: 600, hpx: 800,
  },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    { key: 'text', label: 'Text', group: 'Type', type: 'text' },
    numeric('fontsize', 'Font size % of artboard width', 'Type', 0.01, 4000, 0.01), choice('fit', 'Size mode', 'Type', ['free', 'fit width']),
    ...[['lineh', 'Line height %', 20, 400], ['xscale', 'X scale %', 1, 400], ['yscale', 'Y scale %', 1, 400], ['basex', 'Baseline x %', -100, 100], ['basey', 'Baseline y %', -100, 100], ['track', 'Tracking %', -20, 200], ['gapx', 'Word gap %', 0, 300]].map(([key, label, min, max]) => numeric(String(key), String(label), 'Type', Number(min), Number(max))),
    choice('motion', 'Motion', 'Motion', ['up', 'down', 'left', 'right', 'none']), numeric('secs', 'Cycle seconds', 'Motion', 1, 40, 0.5),
    ...[['rows', 'Grid rows', 1, 240], ['rowgap', 'Row gap %', 0, 70], ['rowphase', 'Row phase %', -100, 100], ['rowlag', 'Row lag %', -100, 100], ['skew', 'Slant degrees', -60, 60], ['stagger', 'Row offset %', 0, 100]].map(([key, label, min, max]) => numeric(String(key), String(label), 'Grid', Number(min), Number(max))),
    numeric('seed', 'Seed', 'Stripes', 1, 9999), numeric('depth', 'Column depth', 'Stripes', 1, 9), numeric('jitter', 'Width jitter %', 'Stripes', 0, 95), numeric('minw', 'Minimum stripe % of artboard width', 'Stripes', 0.01, 80, 0.01),
    choice('scale', 'Ink scale', 'Ink', ['uniform', 'proportional']), numeric('ink0', 'Thin ink %', 'Ink', 0, 200), numeric('ink1', 'Thick ink %', 'Ink', 0, 200), numeric('contrast', 'Contrast %', 'Ink', 20, 400), numeric('levels', 'Levels', 'Ink', 1, 8),
    ...['paper', 'c1', 'c2', 'c3'].map((key, i) => ({ key, label: i ? `Stripe ${i} colour` : 'Paper colour', group: 'Palette', type: 'color' as const })), choice('blend', 'Stripe blend', 'Palette', ['normal', 'multiply', 'screen', 'difference']),
    numeric('fps', 'GIF fps', 'Output', 5, 30), numeric('gifpx', 'GIF pixels', 'Output', 200, 1000, 50),
  ],
  evaluate: evaluateStripeMarquee,
};
export const stripeMarquee: EditorTool = {
  id: adapter.id, name: 'Stripe Marquee', description: 'Font-derived lettering expressed through scrolling stripe thickness.', status: 'ready', adapter,
  renderer: { render(frame: Frame<StripeScene>, target: HTMLElement) { target.innerHTML = frame.scene.svg; } }, artboard, accent: false, playback: true,
  prepareSettings(saved) {
    const params = { ...saved };
    if (params.rel !== 1) {
      const width = Math.max(100, Math.min(8000, Number(params.wpx) || 1500));
      for (const key of ['fontsize', 'minw']) if (typeof params[key] === 'number') params[key] = params[key] / width * 100;
    }
    params.rel = 1;
    return params;
  },
};
// Like the prototype, SVG/PNG bake the selected instant; GIF carries the motion cycle.
export const artwork = svgArtwork(adapter.id);
