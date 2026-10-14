import { evaluateArrowMaze } from '../engine/client';
import type { Control, Frame, ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { ExportHandlers } from '../workspace/exports';
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
  defaults: { seed: 42, cols: 14, amount: 75, length: 14, turn: 40, fork: 30, shaft: 40, style: 'arc', panels: 4, invert: 40, words: '', textmin: 40, tgap: 15, tblock: true, margin: 2,
    motion: 'none', speed: 3, hold: 35, stagger: 50, timing: 'ease out', paper: '#f4f1ea', ink: '#111111', arrow: '#111111', wpx: 600, hpx: 800, fps: 10, gifpx: 600,
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
  async evaluate(input) {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = '700 100px Arial';
    const metrics: Record<string, number[]> = {};
    for (const entry of String(input.design.params.words ?? '').split('|')) {
      for (const line of [entry.trim(), ...entry.split('/').map(s => s.trim()), ...entry.split(/\s+/)]) {
        const m = ctx.measureText(line);
        metrics[line] = [Math.max(m.width, m.actualBoundingBoxRight) + Math.max(0, m.actualBoundingBoxLeft), m.actualBoundingBoxAscent, m.actualBoundingBoxDescent, Math.max(0, m.actualBoundingBoxLeft)];
      }
    }
    return evaluateArrowMaze(input, metrics);
  },
};
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
async function raster(svg: string, width: number, height: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, width, height);
    return { canvas, ctx };
  } finally { URL.revokeObjectURL(url); }
}
const word16 = (n: number) => [n & 255, n >> 8 & 255];
// Literal LZW blocks clear before dictionary growth changes the nine-bit code width.
function gifFrame(pixels: Uint8ClampedArray, width: number, height: number, delay: number) {
  const count = width * height;
  const packed = new Uint8Array(Math.ceil((count + Math.ceil(count / 128) + 1) * 9 / 8));
  let bits = 0;
  const code = (n: number) => { for (let i = 0; i < 9; i++, bits++) if (n & 1 << i) packed[bits >> 3] |= 1 << (bits & 7); };
  for (let i = 0; i < count; i++) {
    if (i % 128 === 0) code(256);
    const k = i * 4; const index = (pixels[k] & 224) | (pixels[k + 1] & 224) >> 3 | pixels[k + 2] >> 6;
    code(pixels[k + 3] < 128 ? 0 : index || 1);
  }
  code(257);
  const blocks: Uint8Array[] = [new Uint8Array([0x21, 0xf9, 4, 5, ...word16(delay), 0, 0, 0x2c, 0, 0, 0, 0, ...word16(width), ...word16(height), 0, 8])];
  for (let i = 0; i < packed.length; i += 255) { const block = packed.slice(i, i + 255); blocks.push(new Uint8Array([block.length]), block); }
  blocks.push(new Uint8Array([0])); return blocks;
}
export const artwork: ExportHandlers<Parameters, MazeScene> = {
  async svg({ frame }) { return { name: 'arrow-maze.svg', blob: new Blob([frame.scene.staticSvg.replace(/ data-(?:arrow|word)="[^"]*"/g, '')], { type: 'image/svg+xml' }) }; },
  async png({ frame }) {
    const { canvas } = await raster(frame.scene.staticSvg, frame.dimensions.width, frame.dimensions.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
    return { name: 'arrow-maze.png', blob };
  },
  async gif({ input, frame, evaluate, progress }) {
    const p = input.design.params;
    const fps = Math.max(5, Math.min(30, Number(p.fps) || 10));
    const scale = Math.min(1, (Number(p.gifpx) || 600) / Math.max(frame.dimensions.width, frame.dimensions.height));
    const width = Math.round(frame.dimensions.width * scale), height = Math.round(frame.dimensions.height * scale);
    const palette = new Uint8Array(768);
    for (let i = 0; i < 256; i++) palette.set([Math.round((i >> 5) * 255 / 7), Math.round((i >> 2 & 7) * 255 / 7), (i & 3) * 85], i * 3);
    palette.set([0, 0, 0], 3);
    const parts: BlobPart[] = [new Uint8Array([71, 73, 70, 56, 57, 97, ...word16(width), ...word16(height), 0xf7, 0, 0]), palette, new Uint8Array([0x21, 0xff, 11, ...new TextEncoder().encode('NETSCAPE2.0'), 3, 1, 0, 0, 0])];
    const count = Math.max(1, Math.round(frame.durationSeconds * fps));
    for (let i = 0; i < count; i++) {
      progress(`Encoding frame ${i + 1}/${count}…`);
      const evaluated = await evaluate(frame.durationSeconds ? i * frame.durationSeconds / count : 0);
      const { ctx } = await raster(evaluated.scene.svg, width, height);
      parts.push(...gifFrame(ctx.getImageData(0, 0, width, height).data, width, height, Math.max(2, Math.round(100 / fps))));
      if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve));
    }
    parts.push(new Uint8Array([0x3b]));
    return { name: 'arrow-maze.gif', blob: new Blob(parts, { type: 'image/gif' }) };
  },
};
