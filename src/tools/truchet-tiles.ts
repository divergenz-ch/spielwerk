import { evaluatePrimitive } from '../engine/client';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, dimensions, artboard } from './arrow-path';
import { svgArtwork } from './svg-artwork';
export type TileScene = { svg: string; staticSvg: string; columns: number; rows: number; tiles: { style: string; turn: number; ink: string }[] };
export const adapter: ToolAdapter<Parameters, TileScene> = {
  id: 'truchet-tiles',
  defaults: { seed: 42, cols: 8, style: 'arcs', lines: 1, stroke: 40, bias: 50, ink: '#1c1c1c', ink2: '#e84f5e', duo: 0, paper: '#f4f1ea', wpx: 1500, hpx: 2000 },
  dimensions, capabilities: { responsive: true, motion: false, formats: ['svg', 'png'] },
  controls: [
    numeric('seed', 'Seed', 'Tiles', 1, 9999), numeric('cols', 'Tiles across', 'Tiles', 2, 40), choice('style', 'Style', 'Tiles', ['arcs', 'triangles', '10 PRINT', 'mix']), numeric('lines', 'Arcs per corner', 'Tiles', 1, 5), numeric('stroke', 'Stroke % of strand spacing', 'Tiles', 5, 95), numeric('bias', 'Turn bias %', 'Tiles', 0, 100, 5),
    ...['ink', 'ink2', 'paper'].map(key => ({ key, label: key, group: 'Colour', type: 'color' as const })), numeric('duo', 'Second ink %', 'Colour', 0, 100, 5),
  ],
  evaluate: input => evaluatePrimitive(input),
};
export const truchetTiles: EditorTool = {
  id: adapter.id, name: 'Truchet Tiles', description: 'Quarter-circle strands, triangles and diagonal tilings.', status: 'ready', adapter,
  renderer: { render(frame, target) { target.innerHTML = frame.scene.svg; } },
  artboard: { ...artboard, initial: { width: 1500, height: 2000 } }, accent: false,
};
const handlers = svgArtwork(adapter.id);
export const artwork = { svg: handlers.svg, png: handlers.png };
