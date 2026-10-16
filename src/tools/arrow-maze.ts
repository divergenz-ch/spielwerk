import { evaluateArrowMaze } from '../engine/client';
import type { Control, EvaluationInput, Frame, ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import { svgArtwork } from './svg-artwork';
import type { Parameters } from '../workspace/storage';

export type MazeScene = {
  svg: string; staticSvg: string; columns: number; rows: number; cell: number; clearance: number;
  arrows: { cells: number[]; parent: number | null; points: number[][]; progress: number; panel: number }[];
  panels: { bounds: number[]; inverted: boolean }[];
  words: { text: string; bounds: number[]; center: number[]; size: number }[];
  unplaced: string[];
};
const numeric = (key: string, label: string, group: string, min: number, max: number, step = 1): Control => ({ key, label, group, type: 'number', min, max, step });
const choice = (key: string, label: string, group: string, options: string[]): Control => ({ key, label, group, type: 'choice', options });
export const adapter: ToolAdapter<Parameters, MazeScene> = {
  id: 'arrow-maze',
  // A dense cobalt route map, broken into alternating paper and ink panels.
  defaults: { seed: 127, cols: 20, amount: 90, length: 24, turn: 55, fork: 40, shaft: 32, style: 'arc', panels: 6, invert: 45, words: '', textmin: 40, tgap: 15, tblock: true, margin: 4,
    motion: 'draw loop', speed: 5, hold: 50, stagger: 35, timing: 'ease out', paper: '#f4efdf', ink: '#263bcb', arrow: '#263bcb', wpx: 600, hpx: 800, fps: 10, gifpx: 600,
    show_paper: true, show_panels: true, show_arrows: true, show_text: true },
  dimensions: { width: { min: 100, max: 8000 }, height: { min: 100, max: 8000 } },
  capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    numeric('seed', 'Seed', 'Arrows', 1, 9999), numeric('cols', 'Density', 'Arrows', 2, 60), numeric('amount', 'Arrow amount', 'Arrows', 5, 100, 5), numeric('length', 'Max length', 'Arrows', 2, 80), numeric('turn', 'Bend chance', 'Arrows', 0, 100, 5), numeric('fork', 'Branch chance', 'Arrows', 0, 100, 5),
    choice('style', 'Style', 'Geometry', ['bend', 'arc']), numeric('shaft', 'Shaft width', 'Geometry', 10, 60), numeric('margin', 'Margin', 'Geometry', 0, 40),
    numeric('panels', 'Panel amount', 'Panels', 1, 32), numeric('invert', 'Inverted panels', 'Panels', 0, 100, 5),
    { key: 'words', label: 'Words', group: 'Text', type: 'text' }, numeric('textmin', 'Shrink to', 'Text', 10, 100, 5), numeric('tgap', 'Text clearance', 'Text', 0, 100, 5), { key: 'tblock', label: 'Text clears arrows', group: 'Text', type: 'toggle' },
    ...['paper', 'panels', 'arrows', 'text'].map(key => ({ key: `show_${key}`, label: `Show ${key}`, group: 'Layers', type: 'toggle' as const })),
    ...['paper', 'ink', 'arrow'].map(key => ({ key, label: `${key} colour`, group: 'Palette', type: 'color' as const })),
    choice('motion', 'Motion', 'Motion', ['none', 'draw in', 'draw loop']), numeric('speed', 'Cycle seconds', 'Motion', 0.5, 20, 0.5), numeric('hold', 'Hold', 'Motion', 0, 90, 5), numeric('stagger', 'Stagger', 'Motion', 0, 100, 5), choice('timing', 'Timing', 'Motion', ['ease out', 'linear', 'snap']),
    numeric('fps', 'GIF fps', 'Output', 5, 30), numeric('gifpx', 'GIF pixels', 'Output', 200, 1000, 50),
  ],
  evaluate: input => evaluateMaze(input),
};
export async function evaluateMaze(input: EvaluationInput<Parameters>, hostCell?: number): Promise<Frame<MazeScene>> {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = '700 100px Arial';
  const metrics: Record<string, number[]> = {};
  for (const entry of String(input.design.params.words ?? '').split('|')) {
    for (const line of [entry.trim(), ...entry.split('/').map(s => s.trim()), ...entry.split(/\s+/)]) {
      const m = ctx.measureText(line);
      metrics[line] = [Math.max(m.width, m.actualBoundingBoxRight) + Math.max(0, m.actualBoundingBoxLeft), m.actualBoundingBoxAscent, m.actualBoundingBoxDescent, Math.max(0, m.actualBoundingBoxLeft)];
    }
  }
  return evaluateArrowMaze(input, metrics, hostCell);
}
export const arrowMaze: EditorTool = {
  id: adapter.id, name: 'Arrow Maze', description: 'Branching arrows with text and draw-in motion.', status: 'ready', adapter,
  renderer: { render(frame: Frame<MazeScene>, target: HTMLElement) {
    target.innerHTML = frame.scene.svg;
    if (frame.scene.unplaced.length) {
      const message = document.createElement('p');
      message.setAttribute('role', 'status'); message.setAttribute('aria-label', 'Unplaced words');
      message.textContent = `Unplaced words: ${frame.scene.unplaced.join(' | ')}`;
      target.append(message);
    }
  } },
  artboard: { initial: { width: 600, height: 800 }, dimensions: true, presets: ['1:1', '3:4', '4:3', '16:9'], swap: true, ratioLock: true, handles: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] },
  accent: true,
  interaction: {
    hit(frame: Frame<MazeScene>, x, y) {
      if (!frame.scene.svg.includes('id="text"')) return;
      const word = frame.scene.words.find(word => x >= word.bounds[0] && x <= word.bounds[0] + word.bounds[2] && y >= word.bounds[1] && y <= word.bounds[1] + word.bounds[3]);
      return word && { key: word.text, center: word.center };
    },
    drag(params, key, x, y) { const nodes = (params.nodes ?? {}) as Record<string, unknown>; return { ...params, nodes: { ...nodes, [key]: { ...(nodes[key] as object ?? {}), x, y } } }; },
  },
  playback: true,
};
export const artwork = svgArtwork(adapter.id);
