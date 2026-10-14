<script lang="ts">
  import { untrack } from 'svelte';
  import type { Control } from '../engine/contracts';
  import type { Parameters } from './storage';
  import { parameterPane } from './tweakpane';
  let { controls, params, defaults, expandedGroups, onchange, onexpand }: {
    controls: readonly Control[]; params: Parameters; defaults: Parameters;
    expandedGroups: string[]; onchange: (key: string, value: unknown) => void;
    onexpand: (group: string, open: boolean) => void;
  } = $props();
  let container: HTMLDivElement;
  let pane = $state<ReturnType<typeof parameterPane>>();
  $effect(() => {
    const definitions = controls;
    const mounted = untrack(() => parameterPane(container, definitions, params, defaults, expandedGroups,
      (key, value) => onchange(key, value), (group, open) => onexpand(group, open)));
    pane = mounted;
    return () => mounted.dispose();
  });
  $effect(() => { pane?.refresh(params, expandedGroups); });
</script>

<div class="parameters" bind:this={container} aria-label="Tool parameters" role="group"></div>

<style>
  .parameters { --tp-base-font-size: 12px; --tp-container-unit-size: 24px; }
  .parameters :global(:focus-visible) { outline: 2px solid #83b7ff; outline-offset: -2px; }
  .parameters :global(label:has(input:focus-visible)) { outline: 2px solid #83b7ff; }
</style>
