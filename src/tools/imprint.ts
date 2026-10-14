import { evaluatePrimitive } from '../engine/client';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, dimensions, artboard } from './arrow-path';
import { svgArtwork } from './svg-artwork';
export type ImprintScene = { svg: string; staticSvg: string; motionSvg: string; rays: { start: number[]; end: number[]; width: number; progress: number; main: boolean }[] };
export const adapter: ToolAdapter<Parameters, ImprintScene> = {
  id: 'imprint',
  defaults: { seed: 42, rays: 14, length: 78, vary: 45, scatter: 60, pairs: 45, rel: 1, stroke: 0.2, relief: 'raised', depth: 0.1333, soften: 0.0667, light: 225, shadow: '#000000', shadowO: 20, glow: '#ffffff', glowO: 55, halo: 35, paper: '#e9e7e3', line: '#f1efeb', motion: 'drift', drift: 40, speed: 6, stagger: 60, wpx: 1500, hpx: 1500 },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png'] },
  controls: [
    numeric('seed', 'Seed', 'Rays', 1, 9999), numeric('rays', 'Rays', 'Rays', 3, 40), numeric('length', 'Reach %', 'Rays', 20, 100), numeric('vary', 'Length variation %', 'Rays', 0, 90, 5), numeric('scatter', 'Scatter %', 'Rays', 0, 100, 5), numeric('pairs', 'Pairs %', 'Rays', 0, 100, 5), numeric('stroke', 'Stroke % of artboard width', 'Rays', 0.0001, 12, 0.0001),
    choice('relief', 'Relief', 'Relief', ['raised', 'pressed']), numeric('depth', 'Depth % of artboard width', 'Relief', 0, 8, 0.0001), numeric('soften', 'Soften % of artboard width', 'Relief', 0, 6, 0.0001), numeric('light', 'Light angle', 'Relief', 0, 360, 5),
    ...['shadow', 'glow', 'paper', 'line'].map(key => ({ key, label: key, group: 'Colour', type: 'color' as const })), numeric('shadowO', 'Shadow opacity %', 'Colour', 0, 100, 5), numeric('glowO', 'Highlight opacity %', 'Colour', 0, 100, 5), numeric('halo', 'Halo %', 'Colour', 0, 100, 5),
    choice('motion', 'Motion', 'Motion', ['none', 'drift', 'grow in', 'grow loop']), numeric('drift', 'Drift %', 'Motion', 0, 100, 5), numeric('speed', 'Cycle seconds', 'Motion', 0.5, 20, 0.5), numeric('stagger', 'Stagger %', 'Motion', 0, 100, 5),
  ],
  evaluate: input => evaluatePrimitive(input),
};
export const imprint: EditorTool = {
  id: adapter.id, name: 'Imprint', description: 'Raised or pressed ray bursts with light, halo and visual motion.', status: 'ready', adapter,
  renderer: { render(frame, target) { target.innerHTML = frame.scene.svg; } },
  artboard: { ...artboard, initial: { width: 1500, height: 1500 } }, accent: false, playback: true,
  prepareSettings(saved) {
    const params = { ...saved };
    if (params.rel !== 1) {
      const basis = Math.max(100, Math.min(8000, Number(params.wpx) || 1500));
      for (const key of ['stroke', 'depth', 'soften']) if (typeof params[key] === 'number') params[key] = params[key] / basis * 100;
    }
    params.rel = 1;
    return params;
  },
};
const handlers = svgArtwork(adapter.id, true);
export const artwork = { svg: handlers.svg, png: handlers.png };
