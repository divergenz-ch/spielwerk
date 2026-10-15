<script lang="ts">
  import { untrack } from 'svelte';
  import type { EvaluationInput, OutputFormat, ToolAdapter } from '../engine/contracts';
  import { exportArtwork, supportedFormats, type ExportDestination, type ExportHandlers } from './exports';
  let { adapter, handlers, input, destination, previewStatus }: {
    adapter: ToolAdapter<any, any>; handlers: ExportHandlers; input: EvaluationInput<any>; destination: ExportDestination;
    previewStatus: 'updating' | 'failed' | 'current';
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
      message = result.destination === 'browser downloads'
        ? `Download started: ${file.name} (browser downloads).`
        : `Saved ${file.name} to ${result.destination}.`;
      error = result.warning ?? '';
    } catch (cause) { message = ''; error = `Export failed: ${String(cause)}`; }
    finally { busy = false; }
  }
</script>

<fieldset class="export-panel" aria-label="Artwork export">
  <legend class="sr-only">Artwork export</legend>
  {#if formats.length}
    <label class="ui-row">Export as<select class="ui-select" aria-label="Output format" value={format} disabled={busy} onchange={event => { selection = event.currentTarget.value as OutputFormat; }}>
      {#each formats as value}<option value={value}>{value === 'embed' ? 'Website embed (ZIP)' : value.toUpperCase()}</option>{/each}
    </select></label>
    {#if format === 'embed'}<p>Extract the ZIP and serve its demo or copy its website snippet. Keep the included runtime, Wasm, and fonts together.</p>{/if}
    {#if previewStatus !== 'current'}<p>Preview {previewStatus === 'updating' ? 'is updating' : 'failed'}. Export captures current settings, dimensions, typefaces and time at activation, not the previous artwork.</p>{/if}
    <button class="ui-button primary" disabled={busy} onclick={download}>
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v8m-3-3 3 3 3-3M3 11v3h10v-3"/></svg>
      Export artwork
    </button>
    <div class="destination">
      <p title={`Destination: ${folder ?? 'browser downloads'}`}>Destination: {folder ?? 'browser downloads'}</p>
      {#if destination.canPick}<button class="ui-button quiet icon" aria-label="Choose export folder" title="Choose export folder" disabled={busy} onclick={pick}>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M2 4h5l1.5 2H14v7H2zM2 4V3h5l1.5 2H13v1"/></svg>
      </button>{/if}
    </div>
    {#if message}<p role="status" aria-label="Export progress">{message}</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
  {:else}
    <p>Artwork exports are not available for this tool yet.</p>
  {/if}
</fieldset>

<style>
  .export-panel { display: grid; flex: none; gap: 8px; min-width: 0; margin: 0; padding: 14px 16px 10px; border: 0; border-top: 1px solid var(--ui-line); }
  .primary { height: 32px; background: var(--ui-ink); color: var(--ui-panel); font-weight: 500; }
  .primary:hover:not(:disabled) { background: #484a43; }
  .destination { display: flex; align-items: center; justify-content: space-between; min-width: 0; gap: 8px; min-height: 24px; }
  .destination p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .destination button { flex: none; height: 24px; }
  p { margin: 0; color: var(--ui-muted); font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }
  p[role=alert] { color: var(--ui-danger); }
</style>
