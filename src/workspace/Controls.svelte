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
  .parameters {
    --tp-base-background-color: transparent;
    --tp-base-border-radius: 0;
    --tp-base-shadow-color: transparent;
    --tp-base-font-family: var(--ui-font, system-ui, sans-serif);
    --tp-blade-border-radius: 4px;
    --tp-blade-horizontal-padding: 6px;
    --tp-blade-value-width: 156px;
    --tp-container-unit-size: 26px;
    --tp-container-unit-spacing: 4px;
    --tp-container-horizontal-padding: 16px;
    --tp-container-vertical-padding: 10px;
    --tp-container-background-color: transparent;
    --tp-container-background-color-hover: var(--ui-field, #eaeae7);
    --tp-container-background-color-focus: var(--ui-field, #eaeae7);
    --tp-container-background-color-active: var(--ui-hover, #e0e0dc);
    --tp-container-foreground-color: var(--ui-ink, #30312e);
    --tp-button-background-color: var(--ui-field, #eaeae7);
    --tp-button-background-color-hover: var(--ui-hover, #e0e0dc);
    --tp-button-background-color-focus: var(--ui-hover, #e0e0dc);
    --tp-button-background-color-active: var(--ui-active, #d5d5d0);
    --tp-button-foreground-color: var(--ui-ink, #30312e);
    --tp-input-background-color: var(--ui-field, #eaeae7);
    --tp-input-background-color-hover: var(--ui-hover, #e0e0dc);
    --tp-input-background-color-focus: var(--ui-hover, #e0e0dc);
    --tp-input-background-color-active: var(--ui-active, #d5d5d0);
    --tp-input-foreground-color: var(--ui-ink, #30312e);
    --tp-label-foreground-color: var(--ui-muted, #6b6c66);
    --tp-monitor-background-color: var(--ui-field, #eaeae7);
    --tp-monitor-foreground-color: var(--ui-ink, #30312e);
    --tp-groove-foreground-color: var(--ui-line, #ddddd8);
  }
  .parameters :global(.tp-rotv) { font-size: 12px; font-weight: 400; }
  .parameters :global(.tp-rotv > .tp-rotv_c) { padding: 0; }
  .parameters :global(.tp-rotv_c > .tp-fldv) { margin: 0 !important; border-top: 1px solid var(--ui-line, #ddddd8); }
  .parameters :global(.tp-fldv_b) { height: 36px; line-height: 36px; font-weight: 600; }
  .parameters :global(.tp-fldv_t) { padding-left: 0; }
  .parameters :global(.tp-fldv_i) { display: none; }
  .parameters :global(.tp-fldv_c) { padding-left: 0; }
  .parameters :global(.tp-fldv_m) { width: 5px; height: 5px; right: 19px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; background: none; border-radius: 0; opacity: .65; transform: rotate(-45deg); }
  .parameters :global(.tp-fldv-expanded > .tp-fldv_b > .tp-fldv_m) { transform: rotate(45deg); }
  .parameters :global(.tp-lblv_l) { padding-left: 0; padding-right: 8px; line-height: 1.3; }
  .parameters :global(.tp-lstv_s) { font-weight: 400; padding-left: 8px; }
  .parameters :global(.tp-txtv_i) { font-family: var(--ui-mono, monospace); font-size: 11px; font-variant-numeric: tabular-nums; }
  .parameters :global(.tp-sldv_k::after) { width: 8px; height: 14px; right: -4px; border-radius: 3px; background: var(--ui-panel, #f8f8f6); box-shadow: 0 0 0 1px #bcbdb6, 0 1px 2px #00000012; }
  .parameters :global(.tp-sldv_t:active .tp-sldv_k::after) { background: var(--ui-active, #d5d5d0); }
  .parameters :global(.parameter-number) { position: relative; }
  .parameters :global(.parameter-number > .tp-lblv_v) { box-sizing: border-box; padding-right: 22px; }
  .parameters :global(.parameter-reset) { position: absolute; right: 14px; top: 0; display: grid; place-items: center; width: 22px; height: 26px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--ui-muted, #6b6c66); cursor: pointer; opacity: 0; }
  .parameters :global(.parameter-reset svg) { width: 13px; height: 13px; }
  .parameters :global(.parameter-number:hover .parameter-reset), .parameters :global(.parameter-number:focus-within .parameter-reset) { opacity: 1; }
  .parameters :global(.parameter-reset:hover) { background: var(--ui-field, #eaeae7); }
  .parameters :global(:focus-visible) { outline: 2px solid var(--ui-focus, #52759b); outline-offset: -2px; }
  .parameters :global(label:has(input:focus-visible)) { outline: 2px solid var(--ui-focus, #52759b); }
  @media (hover: none) { .parameters :global(.parameter-reset) { opacity: 1; } }
</style>
