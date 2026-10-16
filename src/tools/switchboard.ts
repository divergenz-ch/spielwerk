import { evaluateSwitchboard } from '../engine/client';
import type { EvaluationInput, Frame, ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, dimensions, artboard } from './arrow-path';
import { svgArtwork } from './svg-artwork';
export type SwitchboardScene = {
  svg: string; staticSvg: string; motionSvg: string;
  cells: { id: number; kind: string; x: number; y: number; state: number; influence: number }[];
  links: number[][]; states: number[]; order: number[];
};
export const act = (input: EvaluationInput<Parameters>, action: { kind: 'click' | 'swap'; id: number; x?: number; y?: number }): Promise<Frame<SwitchboardScene>> => evaluateSwitchboard(input, action);
export const adapter: ToolAdapter<Parameters, SwitchboardScene> = {
  id: 'switchboard',
  // A softly rounded, live instrument panel in sage, citron and apricot.
  defaults: {
    seed: 42, cols: 5, rows: 7, gap: 20, jitter: 15, buttons: true, dials: true, lights: true, form: true,
    labels: 'ON,OFF,SEND,OK,RUN,A,B,MUTE,ARM,SYNC', rel: 1, stroke: 0.3, radius: 1.1, shadow: 0.6,
    paper: '#e8eddf', ink: '#203c3a', on: '#d7ed77', accent: '#fa7951',
    links: 16, effect: 'colour + size', strength: 55, propagate: 'copy', wires: true, wire: 'curve', wirepx: 0.25,
    motion: 'flow', secs: 6, fps: 20, gifpx: 600, wpx: 1500, hpx: 2000, st: Array(35).fill(1), order: [],
  },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    numeric('seed', 'Seed', 'Grid', 1, 9999), numeric('cols', 'Columns', 'Grid', 2, 12), numeric('rows', 'Rows', 'Grid', 2, 16), numeric('gap', 'Gap %', 'Grid', 0, 60, 2), numeric('jitter', 'Size jitter %', 'Grid', 0, 100, 5),
    ...['buttons', 'dials', 'lights', 'form'].map(key => ({ key, label: key, group: 'Grid', type: 'toggle' as const })),
    { key: 'labels', label: 'Labels', group: 'Grid', type: 'text' },
    numeric('stroke', 'Stroke % of artboard width', 'Look', 0.01, 24, 0.01), numeric('radius', 'Corner % of artboard width', 'Look', 0, 60, 0.01), numeric('shadow', 'Shadow % of artboard width', 'Look', 0, 40, 0.01),
    ...['paper', 'ink', 'on', 'accent'].map(key => ({ key, label: key, group: 'Look', type: 'color' as const })),
    numeric('links', 'Links', 'Links', 0, 60), choice('effect', 'Link effect', 'Links', ['colour', 'size', 'colour + size']), numeric('strength', 'Strength %', 'Links', 0, 100, 5), choice('propagate', 'Propagate state', 'Links', ['none', 'copy', 'invert']),
    { key: 'wires', label: 'Draw wires', group: 'Links', type: 'toggle' }, choice('wire', 'Wire style', 'Links', ['straight', 'elbow', 'curve']), numeric('wirepx', 'Wire % of artboard width', 'Links', 0.01, 20, 0.01),
    choice('motion', 'Motion', 'Motion', ['none', 'flow']), numeric('secs', 'Cycle seconds', 'Motion', 1, 20), numeric('fps', 'GIF fps', 'Output', 5, 30), numeric('gifpx', 'GIF pixels', 'Output', 200, 1000, 50),
  ],
  evaluate: input => evaluateSwitchboard(input),
};
export const switchboard: EditorTool = {
  id: adapter.id, name: 'Switchboard', description: 'Linked widgets, cell swaps and deterministic wire flow.', status: 'ready', adapter,
  renderer: { render(frame, target) { target.innerHTML = frame.scene.svg; } },
  artboard: { ...artboard, initial: { width: 1500, height: 2000 } }, accent: false, playback: true,
  prepareSettings(saved) {
    const params = { ...saved };
    // Empty legacy state meant the untouched default; start with live wires.
    if (Array.isArray(params.st) && params.st.length === 0) delete params.st;
    if (params.rel !== 1) {
      const basis = Math.max(100, Math.min(8000, Number(params.wpx) || 1500));
      for (const key of ['stroke', 'radius', 'shadow', 'wirepx']) {
        if (typeof params[key] === 'number') params[key] = params[key] / basis * 100;
      }
    }
    params.rel = 1;
    return params;
  },
  interaction: {
    hit(frame: Frame<SwitchboardScene>, _x, _y, target) {
      const group = target instanceof Element ? target.closest('[data-widget]') : null;
      if (!group) return;
      const cell = frame.scene.cells.find(c => c.id === Number(group.getAttribute('data-widget')));
      if (cell) return { key: String(cell.id), center: [cell.x, cell.y] };
    },
    async release(input, key, x, y, moved) {
      const frame = await act(input, { kind: moved ? 'swap' : 'click', id: Number(key), x, y });
      return { st: frame.scene.states, order: frame.scene.order };
    },
  },
};
export const artwork = svgArtwork(adapter.id, true);
