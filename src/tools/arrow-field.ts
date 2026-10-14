import { evaluateArrowField } from '../engine/client';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, dimensions, artboard } from './arrow-path';
import { svgArtwork } from './svg-artwork';
export type FieldScene = { svg: string; staticSvg: string; motionSvg: string; cells: { x: number; y: number; angle: number }[] };
export const adapter: ToolAdapter<Parameters, FieldScene> = {
  id: 'arrow-field',
  defaults: { seed: 42, cols: 14, field: 'noise', scale: 8, turns: 2, snap: 0, shape: 'solid', len: 55, stroke: 12, head: 40, jitter: 0, motion: 'wave', secs: 8, pull: 100, reach: 70, grav: 100, ink: '#ffffff', ink2: '#e84f5e', duo: 0, paper: '#0d0d0d', fps: 20, gifpx: 600, wpx: 1500, hpx: 2000 },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    numeric('seed', 'Seed', 'Field', 1, 9999), numeric('cols', 'Arrows across', 'Field', 2, 60), choice('field', 'Field arrangement', 'Field', ['noise', 'swirl', 'radial', 'grid']), numeric('scale', 'Field scale', 'Field', 1, 40), numeric('turns', 'Turns', 'Field', 1, 8), numeric('snap', 'Snap directions', 'Field', 0, 12),
    choice('shape', 'Arrow shape', 'Arrows', ['solid', 'line']), numeric('len', 'Length %', 'Arrows', 20, 140, 5), numeric('stroke', 'Thickness %', 'Arrows', 2, 40), numeric('head', 'Head %', 'Arrows', 0, 80, 5), numeric('jitter', 'Jitter %', 'Arrows', 0, 100, 5),
    choice('motion', 'Motion', 'Motion', ['none', 'wave', 'spin', 'random']), numeric('secs', 'Turn seconds', 'Motion', 1, 30),
    numeric('pull', 'Pointer pull %', 'Pointer', -100, 100, 5), numeric('reach', 'Pointer reach %', 'Pointer', 5, 200, 5), numeric('grav', 'Gravity falloff %', 'Pointer', 20, 400, 10),
    ...['ink', 'ink2', 'paper'].map(key => ({ key, label: key === 'ink2' ? 'Second ink' : key, group: 'Palette', type: 'color' as const })), numeric('duo', 'Second ink %', 'Palette', 0, 100, 5),
    numeric('fps', 'GIF fps', 'Output', 5, 30), numeric('gifpx', 'GIF pixels', 'Output', 200, 1000, 50),
  ],
  evaluate: input => evaluateArrowField(input),
};
export const arrowField: EditorTool = {
  id: adapter.id, name: 'Arrow Field', description: 'Seeded flow fields, rotating arrows and preview-only pointer gravity.', status: 'ready', adapter,
  renderer: { render(frame, target) { target.innerHTML = frame.scene.svg; } },
  artboard: { ...artboard, initial: { width: 1500, height: 2000 } }, accent: false, playback: true,
  preview: (input, pointer) => evaluateArrowField(input, pointer),
};
export const artwork = svgArtwork(adapter.id, true);
