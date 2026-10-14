import init, { evaluate_fixture, inspect_font } from './pkg/spielwerk_engine.js';
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

export async function inspectFont(bytes: Uint8Array): Promise<{
  unitsPerEm: number; glyphCount: number;
}> {
  await initialize();
  return JSON.parse(inspect_font(bytes));
}
