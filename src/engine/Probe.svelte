<script lang="ts">
  import { onMount } from 'svelte';
  import { evaluateFixture, inspectFont } from './client';
  import type { EvaluationInput, FixtureParams } from './contracts';

  let result = $state('');
  let failure = $state('');
  let frame = $state<Awaited<ReturnType<typeof evaluateFixture>>>();
  const input: EvaluationInput<FixtureParams> = {
    design: {
      toolId: '__fixture__', params: { cellSize: 40 }, seed: 7, assets: [],
      artboard: { mode: 'responsive', dimensions: { width: 120, height: 80 } },
    },
    timeSeconds: 0.5,
  };

  onMount(() => {
    (async () => {
      const first = await evaluateFixture(input);
      const repeated = await evaluateFixture(input);
      const resized = await evaluateFixture({
        ...input, design: {
          ...input.design,
          artboard: { mode: 'responsive', dimensions: { width: 200, height: 80 } },
        },
      });
      const later = await evaluateFixture({ ...input, timeSeconds: 1 });
      frame = first;
      result = JSON.stringify({ first, repeated, resized, later });
    })().catch((error) => failure = String(error));
  });

  async function readFont(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      fontResult = JSON.stringify(await inspectFont(new Uint8Array(await file.arrayBuffer())));
    } catch (error) {
      fontResult = String(error);
    }
  }
  let fontResult = $state('');
</script>

<h1>Internal Rust/Wasm boundary proof</h1>
<p>This fixture is not a delivered design tool.</p>
{#if frame}
  <svg aria-label="Rust fixture" width={frame.dimensions.width}
    height={frame.dimensions.height}
    viewBox={`0 0 ${frame.dimensions.width} ${frame.dimensions.height}`}>
    {#each frame.scene.rectangles as rectangle}
      <rect {...rectangle} fill="black" />
    {/each}
  </svg>
{/if}
<output data-testid="frames">{result}</output>
<p role="alert">{failure}</p>
<label>Font boundary probe <input type="file" onchange={readFont} /></label>
<output data-testid="font">{fontResult}</output>
