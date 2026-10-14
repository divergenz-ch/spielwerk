<script lang="ts">
  import type { Control } from '../engine/contracts';
  import type { Parameters } from './storage';
  import { controlValue } from './view';
  let { controls, params, defaults, expandedGroups, onchange, onexpand }: {
    controls: readonly Control[]; params: Parameters; defaults: Parameters;
    expandedGroups: string[]; onchange: (key: string, value: unknown) => void;
    onexpand: (group: string, open: boolean) => void;
  } = $props();
  const groups = $derived([...new Set(controls.map(control => control.group))]);
  function change(control: Control, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const value = control.type === 'toggle' ? input.checked : input.value;
    const next = controlValue(control, value, params[control.key]);
    onchange(control.key, next);
    if (control.type === 'number') input.value = String(next);
  }
</script>

{#each groups as group}
  <details open={expandedGroups.includes(group)} ontoggle={event => onexpand(group, event.currentTarget.open)}>
    <summary>{group}</summary>
    {#each controls.filter(control => control.group === group) as control}
      <div class="control">
        {#if control.type === 'number'}
          <label>{control.label}
            <input type="range" min={control.min} max={control.max} step={control.step} value={Number(params[control.key])}
              oninput={event => change(control, event)} ondblclick={() => onchange(control.key, defaults[control.key])} />
          </label>
          <label>{control.label} exact
            <input type="number" min={control.min} max={control.max} step={control.step} value={Number(params[control.key])} onchange={event => change(control, event)} />
          </label>
          <button type="button" aria-label={`Reset ${control.label}`} onclick={() => onchange(control.key, defaults[control.key])}>Reset</button>
        {:else if control.type === 'choice'}
          <label>{control.label}<select aria-label={control.label} value={String(params[control.key])} onchange={event => change(control, event)}>
            {#each control.options as option}<option>{option}</option>{/each}
          </select></label>
        {:else if control.type === 'toggle'}
          <label>{control.label}<input type="checkbox" checked={Boolean(params[control.key])} onchange={event => change(control, event)} /></label>
        {:else}
          <label>{control.label}<input type={control.type} value={String(params[control.key])} oninput={event => change(control, event)} /></label>
        {/if}
      </div>
    {/each}
  </details>
{/each}

<style>
  details { border-bottom: 1px solid #ccc; padding: .5rem 0; }
  summary { cursor: pointer; font-weight: 600; }
  .control { display: flex; flex-wrap: wrap; gap: .5rem; margin: .5rem 0; }
  label { display: flex; align-items: center; gap: .5rem; }
  input[type=number] { width: 5rem; }
</style>
