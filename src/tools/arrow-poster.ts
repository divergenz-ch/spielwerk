import { evaluateArrowPath } from '../engine/client';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, motionDefaults, motionControls, dimensions, artboard, renderer, relativeSettings, type ArrowPathScene } from './arrow-path';
import { svgArtwork } from './svg-artwork';
const kinds = ['block', 'round', 'roof', 'tri', 'hook'];
export const adapter: ToolAdapter<Parameters, ArrowPathScene> = {
  id: 'arrow-poster',
  // Dark silhouettes with generous, sunset-to-lilac contour bands.
  defaults: {
    ...motionDefaults, seed: 24, count: 7, cols: 2, rows: 3, size: 75, jitter: 35, snap: '45°',
    headL: 45, headW: 85, shaftW: 32, shaftL: 110, variety: 30,
    color: '#292146', paper: '#f8d9ba', rel: 1, cwidth: 1.2, gradA: '#ff7548', gradB: '#8e83d8', steps: 6,
    ...Object.fromEntries(kinds.map(kind => [`kind_${kind}`, !['roof', 'tri'].includes(kind)])), wpx: 600, hpx: 800,
  },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    numeric('seed', 'Seed', 'Arrows', 1, 9999), numeric('count', 'Arrows', 'Arrows', 1, 15), numeric('size', 'Scale %', 'Arrows', 40, 200, 5), numeric('cols', 'Grid columns', 'Arrows', 1, 5), numeric('rows', 'Grid rows', 'Arrows', 1, 6), numeric('jitter', 'Jitter', 'Arrows', 0, 100, 5), choice('snap', 'Rotation', 'Arrows', ['free', '45°', '90°']),
    ...kinds.map(kind => ({ key: `kind_${kind}`, label: `Use ${kind}`, group: 'Shapes', type: 'toggle' as const })),
    numeric('headL', 'Head length %', 'Geometry', 15, 85), numeric('headW', 'Head width %', 'Geometry', 20, 130), numeric('shaftW', 'Shaft width %', 'Geometry', 8, 90), numeric('shaftL', 'Shaft length %', 'Geometry', 10, 500, 5), numeric('variety', 'Variety', 'Geometry', 0, 100, 5),
    ...['color', 'paper', 'gradA', 'gradB'].map(key => ({ key, label: key === 'color' ? 'Arrow colour' : key, group: 'Palette', type: 'color' as const })),
    numeric('cwidth', 'Contour % of width', 'Palette', 0, 3, 0.01), numeric('steps', 'Contour colours', 'Palette', 1, 8), ...motionControls,
  ],
  evaluate(input) {
    const params = input.design.params;
    const selected = kinds.filter(kind => params[`kind_${kind}`] !== false && (params[`kind_${kind}`] === true || !Array.isArray(params.kinds) || params.kinds.includes(kind)));
    return evaluateArrowPath({ ...input, design: { ...input.design, params: { ...params, kinds: selected.length ? selected : kinds } } });
  },
};
export const arrowPoster: EditorTool = {
  id: adapter.id, name: 'Arrow Poster', description: 'Seeded grid arrows, stacked contours and draw-in motion.', status: 'ready', adapter, renderer, artboard, accent: false, playback: true,
  prepareSettings: saved => relativeSettings(saved, 'cwidth', kinds, 'kinds', 'kind'),
  interaction: {
    hit(frame, _x, _y, target) {
      const group = target instanceof Element ? target.closest('[data-arrow]') : null;
      const id = Number(group?.getAttribute('data-arrow'));
      if (!group || !frame.scene.arrows.some((a: { id: number }) => a.id === id)) return;
      return { key: String(id), center: [0, 0] };
    },
    click(params, key) {
      const count = Number(params.count);
      const order = Array.isArray(params.zorder) ? params.zorder.filter(i => Number.isInteger(i) && Number(i) >= 0 && Number(i) < count) : [];
      for (let i = 0; i < count; i++) if (!order.includes(i)) order.push(i);
      return { ...params, zorder: order.filter(i => i !== Number(key)).concat(Number(key)) };
    },
  },
};
export const artwork = svgArtwork(adapter.id, true);
