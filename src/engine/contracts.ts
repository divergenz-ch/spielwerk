export type Dimensions = { width: number; height: number };
export type Layout = { mode: 'fixed' | 'responsive'; dimensions: Dimensions };
export type OutputFormat = 'svg' | 'png' | 'gif' | 'otf' | 'variable-font' | 'embed';
export type Settings = Record<string, number | string | boolean>;
export type Asset = {
  id: string;
  role: 'typeface' | 'accent-typeface' | 'image' | 'stamp';
  mediaType: string;
  bytes: Uint8Array;
};
export type DesignState<P = Settings> = {
  toolId: string;
  params: P;
  seed: number;
  artboard: Layout;
  assets: Asset[];
};
export type ViewState = {
  zoom: number;
  pan: { x: number; y: number };
  expandedGroups: string[];
};
/** Time is seconds from the visual playback origin, never a wall clock. */
export type EvaluationInput<P = Settings> = {
  design: DesignState<P>;
  timeSeconds: number;
};
export type Control = { key: string; label: string; group: string } & (
  | { type: 'number'; min: number; max: number; step: number }
  | { type: 'choice'; options: readonly string[] }
  | { type: 'color' | 'text' | 'toggle' }
);
export type Capabilities = {
  responsive: boolean;
  formats: readonly OutputFormat[];
  motion: boolean;
};
export type DimensionLimits = {
  width: { min: number; max: number };
  height: { min: number; max: number };
};
export type Frame<Scene> = {
  dimensions: Dimensions;
  timeSeconds: number;
  durationSeconds: number;
  scene: Scene;
};
/** Scene is engine-produced geometry, not a JS layout callback or UI state. */
export interface ToolAdapter<Params, Scene> {
  id: string;
  defaults: Params;
  controls: readonly Control[];
  dimensions: DimensionLimits;
  capabilities: Capabilities;
  evaluate(input: EvaluationInput<Params>): Promise<Frame<Scene>>;
}
export interface Renderer<Scene, Target> {
  render(frame: Frame<Scene>, target: Target): void;
}
export type FixtureParams = { cellSize: number };
export type FixtureScene = {
  columns: number;
  rows: number;
  phase: number;
  rectangles: { x: number; y: number; width: number; height: number }[];
};
