import type { Control, Frame } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
export type ArrowPathScene = {
  svg: string; staticSvg: string; motionSvg: string; order: number[];
  arrows: { id: number; profile: string; points: number[][]; widths: number[]; polygon: number[][]; headLength: number; headWidth: number; phase: number; progress: number }[];
};
export const numeric = (key: string, label: string, group: string, min: number, max: number, step = 1): Control => ({ key, label, group, type: 'number', min, max, step });
export const choice = (key: string, label: string, group: string, options: string[]): Control => ({ key, label, group, type: 'choice', options });
export const motionDefaults = { motion: 'none', speed: 3, hold: 35, stagger: 50, timing: 'ease out', fps: 10, gifpx: 600 };
export const motionControls = [
  choice('motion', 'Motion', 'Motion', ['none', 'draw in', 'draw loop']), numeric('speed', 'Cycle seconds', 'Motion', 0.5, 20, 0.5), numeric('hold', 'Hold', 'Motion', 0, 90, 5), numeric('stagger', 'Stagger', 'Motion', 0, 100, 5), choice('timing', 'Timing', 'Motion', ['ease out', 'linear', 'snap']),
  numeric('fps', 'GIF fps', 'Output', 5, 30), numeric('gifpx', 'GIF pixels', 'Output', 200, 1000, 50),
];
export const dimensions = { width: { min: 100, max: 8000 }, height: { min: 100, max: 8000 } };
export const artboard: EditorTool['artboard'] = { initial: { width: 600, height: 800 }, dimensions: true, presets: ['2:3', '3:4', '4:5', '1:1', '9:16'], swap: true, ratioLock: true, handles: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] };
export function relativeSettings(saved: Parameters, key: string, selections: string[], arrayKey: string, prefix: string) {
  const params = { ...saved };
  if (params.rel !== 1 && typeof params[key] === 'number') {
    params[key] = params[key] / Math.max(100, Math.min(8000, Number(params.wpx) || 600)) * 100;
  }
  params.rel = 1;
  if (Array.isArray(params[arrayKey])) {
    for (const selection of selections) {
      const flag = `${prefix}_${selection}`;
      if (params[flag] === undefined) params[flag] = (params[arrayKey] as unknown[]).includes(selection);
    }
  }
  return params;
}
export const renderer = { render(frame: Frame<ArrowPathScene>, target: HTMLElement) { target.innerHTML = frame.scene.svg; } };
