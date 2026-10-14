<script lang="ts">
  import { untrack } from 'svelte';
  import type { EvaluationInput, OutputFormat, ToolAdapter } from '../engine/contracts';
  import { exportArtwork, supportedFormats, type ExportDestination, type ExportHandlers } from './exports';
  let { adapter, handlers, input, destination }: {
    adapter: ToolAdapter<any, any>; handlers: ExportHandlers; input: EvaluationInput<any>; destination: ExportDestination;
  } = $props();
  const formats = $derived(supportedFormats(adapter, handlers));
  let selection = $state<OutputFormat>();
  const format = $derived(selection && formats.includes(selection) ? selection : formats[0]);
  let busy = $state(false);
  let message = $state('');
  let error = $state('');
  let folder = $state(untrack(() => destination.name));
  async function pick() {
    busy = true; error = '';
    try { folder = await destination.pick(); }
    catch (cause) { error = `Folder selection failed: ${String(cause)}`; }
    finally { busy = false; }
  }
  async function download() {
    if (!format || busy) return;
    busy = true; error = '';
    try {
      const file = await exportArtwork(adapter, handlers, format, input, value => { message = value; });
      message = 'Saving artwork…';
      const result = await destination.save(file);
      message = `Saved ${file.name} to ${result.destination}.`;
      error = result.warning ?? '';
    } catch (cause) { message = ''; error = `Export failed: ${String(cause)}`; }
    finally { busy = false; }
  }
</script>

<fieldset>
  <legend>Artwork export</legend>
  {#if formats.length}
    <label>Output format<select aria-label="Output format" value={format} disabled={busy} onchange={event => { selection = event.currentTarget.value as OutputFormat; }}>
      {#each formats as value}<option value={value}>{value === 'embed' ? 'Website embed (ZIP)' : value.toUpperCase()}</option>{/each}
    </select></label>
    {#if format === 'embed'}<p>Extract the ZIP and serve its demo or copy its website snippet. Keep the included runtime, Wasm, and fonts together.</p>{/if}
    <button disabled={busy} onclick={download}>Export artwork</button>
    {#if destination.canPick}<button disabled={busy} onclick={pick}>Choose export folder</button>{/if}
    <p>Destination: {folder ?? 'browser downloads'}</p>
    {#if message}<p role="status" aria-label="Export progress">{message}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
  {:else}
    <p>Artwork exports are not available for this tool yet.</p>
  {/if}
</fieldset>

<style>
  fieldset { display: grid; gap: .5rem; margin: 1rem 0; }
  label { display: flex; gap: .5rem; }
  p { margin: 0; }
</style>
