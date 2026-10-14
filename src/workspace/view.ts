import type { Control, Dimensions, DimensionLimits, Frame, Renderer, ToolAdapter } from '../engine/contracts';
import type { PendingTool } from './registry';
import type { Parameters } from './storage';

export type Handle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
/** Browser-only registration. Tool owners supply these alongside their real adapter. */
export type EditorTool = {
  id: string;
  name: string;
  description: string;
  status: 'ready';
  adapter: ToolAdapter<any, any>;
  renderer: Renderer<any, HTMLElement>;
  artboard: {
    initial: Dimensions;
    dimensions: boolean;
    presets: readonly string[];
    swap: boolean;
    ratioLock: boolean;
    handles: readonly Handle[];
  };
  accent: boolean;
  prepareSettings?(saved: Parameters): Parameters;
  playback?: boolean;
  interaction?: {
    hit(frame: Frame<any>, x: number, y: number, target?: EventTarget | null): { key: string; center: number[] } | undefined;
    drag?(params: Parameters, key: string, x: number, y: number): Parameters;
    click?(params: Parameters, key: string): Parameters;
  };
};
export type CatalogEntry = PendingTool | EditorTool;
export function selectedTool(catalog: readonly CatalogEntry[], hash: string) {
  return catalog.find(tool => tool.id === hash.replace(/^#/, '')) ?? catalog[0];
}
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function boundedSize(size: Dimensions, limits: DimensionLimits): Dimensions {
  return {
    width: Math.round(clamp(size.width, limits.width.min, limits.width.max)),
    height: Math.round(clamp(size.height, limits.height.min, limits.height.max)),
  };
}
export function resize(size: Dimensions, width: number, height: number, limits: DimensionLimits, locked: boolean, axis: 'width' | 'height' = 'width'): Dimensions {
  if (!locked) return boundedSize({ width, height }, limits);
  const scale = clamp(axis === 'width' ? width / size.width : height / size.height,
    Math.max(limits.width.min / size.width, limits.height.min / size.height),
    Math.min(limits.width.max / size.width, limits.height.max / size.height));
  return boundedSize({ width: size.width * scale, height: size.height * scale }, limits);
}
export function controlValue(control: Control, value: unknown, fallback: unknown) {
  if (control.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Number(clamp(control.min + Math.round((number - control.min) / control.step) * control.step, control.min, control.max).toFixed(10));
  }
  if (control.type === 'choice') return control.options.includes(String(value)) ? value : fallback;
  return value;
}
export function controlSettings(controls: readonly Control[], defaults: Parameters, saved: Parameters) {
  const params = { ...defaults, ...saved };
  for (const control of controls) params[control.key] = controlValue(control, params[control.key], defaults[control.key]);
  return params;
}
/** Serial full-detail evaluations coalesce requests; stale completions never publish. */
export function latestEvaluation<Input, Output>(evaluate: (input: Input) => Promise<Output>, publish: (output: Output, input: Input) => void, fail: (error: unknown) => void) {
  let revision = 0;
  let running = false;
  let disposed = false;
  let pending: { input: Input; revision: number } | undefined;
  async function drain() {
    if (running || disposed) return;
    running = true;
    while (pending && !disposed) {
      const request = pending;
      pending = undefined;
      try {
        const output = await evaluate(request.input);
        if (!disposed && request.revision === revision) publish(output, request.input);
      } catch (error) {
        if (!disposed && request.revision === revision) fail(error);
      }
    }
    running = false;
  }
  return {
    request(input: Input) { pending = { input, revision: ++revision }; void drain(); },
    dispose() { disposed = true; pending = undefined; revision++; },
  };
}
