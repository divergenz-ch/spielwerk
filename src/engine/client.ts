import init, { evaluate_fixture, evaluate_arrow_maze, evaluate_arrow_poster, evaluate_arrow_comb, inspect_font } from './pkg/spielwerk_engine.js';
import wasmUrl from './pkg/spielwerk_engine_bg.wasm?url';
import type { EvaluationInput, FixtureParams, FixtureScene, Frame } from './contracts';

let ready: ReturnType<typeof init> | undefined;
function initialize() {
  return ready ??= init({ module_or_path: wasmUrl }).catch((error) => {
    ready = undefined;
    throw error;
  });
}

/** Internal proof only; never registered as a named tool engine. */
export async function evaluateFixture(
  input: EvaluationInput<FixtureParams>,
): Promise<Frame<FixtureScene>> {
  await initialize();
  const { design, timeSeconds } = input;
  if (design.toolId !== '__fixture__') throw new Error('Not a fixture design');
  return JSON.parse(evaluate_fixture(JSON.stringify({
    dimensions: design.artboard.dimensions,
    seed: design.seed,
    cellSize: design.params.cellSize,
    timeSeconds,
  })));
}

export async function evaluateArrowMaze(input: EvaluationInput<any>, metrics: Record<string, number[]>) {
  await initialize();
  if (input.design.toolId !== 'arrow-maze') throw new Error('Not an Arrow Maze design');
  const font = (role: string) => input.design.assets.find(asset => asset.role === role)?.bytes ?? new Uint8Array();
  return JSON.parse(evaluate_arrow_maze(JSON.stringify({
    dimensions: input.design.artboard.dimensions, seed: input.design.seed,
    params: input.design.params, timeSeconds: input.timeSeconds, metrics,
  }), font('typeface'), font('accent-typeface')));
}

export async function evaluateArrowPath(input: EvaluationInput<any>) {
  await initialize();
  const json = JSON.stringify({
    dimensions: input.design.artboard.dimensions, seed: input.design.seed,
    params: input.design.params, timeSeconds: input.timeSeconds,
  });
  if (input.design.toolId === 'arrow-poster') return JSON.parse(evaluate_arrow_poster(json));
  if (input.design.toolId === 'arrow-comb') {
    const font = input.design.assets.find(asset => asset.role === 'typeface')?.bytes ?? new Uint8Array();
    return JSON.parse(evaluate_arrow_comb(json, font));
  }
  throw new Error('Not an arrow-path design');
}

export async function inspectFont(bytes: Uint8Array): Promise<{
  unitsPerEm: number; glyphCount: number;
}> {
  await initialize();
  return JSON.parse(inspect_font(bytes));
}
