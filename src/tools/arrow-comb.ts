import { evaluateArrowPath } from '../engine/client';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import { numeric, choice, motionDefaults, motionControls, dimensions, artboard, renderer, relativeSettings, type ArrowPathScene } from './arrow-path';
import { svgArtwork } from './svg-artwork';
const directions = ['up', 'down', 'left', 'right'];
export const adapter: ToolAdapter<Parameters, ArrowPathScene> = {
  id: 'arrow-comb',
  // Two sweeping vermilion combs, framed by small editorial type rows.
  defaults: {
    ...motionDefaults, seed: 87, bands: 2, count: 36, size: 100, profile: 'swirl', nest: 80,
    swing: 140, curve: 2.2, len: 95, thick: 45, taper: 1.3, headL: 70, headW: 85, variety: 20,
    textTop: 'FORM|01', textMid: 'IN|MOTION', textBot: 'SPIELWERK|STUDIES', rel: 1, textpx: 7,
    ink: '#e54b2c', paper: '#f8eddb', dir_up: true, dir_down: true, dir_left: false, dir_right: false, wpx: 600, hpx: 800,
  },
  dimensions, capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif'] },
  controls: [
    numeric('seed', 'Seed', 'Bands', 1, 9999), numeric('bands', 'Bands', 'Bands', 1, 8), numeric('count', 'Arrows across', 'Bands', 4, 60), numeric('size', 'Arrow scale %', 'Bands', 25, 400, 5), choice('profile', 'Comb profile', 'Bands', ['mixed', 'fan', 'wave', 'swirl']), numeric('nest', 'Nesting', 'Bands', 0, 100, 5),
    ...directions.map(dir => ({ key: `dir_${dir}`, label: `From ${dir}`, group: 'Directions', type: 'toggle' as const })),
    numeric('swing', 'Tail swing', 'Arrows', 0, 170, 5), numeric('curve', 'Bend ease', 'Arrows', 0.5, 4, 0.1), numeric('len', 'Length %', 'Arrows', 20, 160, 5), numeric('thick', 'Thickness %', 'Arrows', 5, 100), numeric('taper', 'Taper', 'Arrows', 0.3, 3, 0.1), numeric('headL', 'Head length %', 'Arrows', 20, 200, 5), numeric('headW', 'Head width %', 'Arrows', 30, 200, 5), numeric('variety', 'Variety', 'Arrows', 0, 100, 5),
    ...['Top', 'Mid', 'Bot'].map((key, i) => ({ key: `text${key}`, label: ['Top row', 'Middle row', 'Bottom row'][i], group: 'Text', type: 'text' as const })), numeric('textpx', 'Text % of width', 'Text', 1, 24, 0.1),
    ...['ink', 'paper'].map(key => ({ key, label: `${key} colour`, group: 'Palette', type: 'color' as const })), ...motionControls,
  ],
  evaluate(input) {
    const params = input.design.params;
    const selected = directions.filter(dir => params[`dir_${dir}`] !== false && (params[`dir_${dir}`] === true || (Array.isArray(params.dirs) ? params.dirs.includes(dir) : ['up', 'down'].includes(dir))));
    return evaluateArrowPath({ ...input, design: { ...input.design, params: { ...params, dirs: selected.length ? selected : directions } } });
  },
};
export const arrowComb: EditorTool = { id: adapter.id, name: 'Arrow Comb', description: 'Fan, wave and swirl bands with tapered tails and font rows.', status: 'ready', adapter, renderer, artboard, accent: false, prepareSettings: saved => relativeSettings(saved, 'textpx', directions, 'dirs', 'dir'), playback: true };
export const artwork = svgArtwork(adapter.id, true);
