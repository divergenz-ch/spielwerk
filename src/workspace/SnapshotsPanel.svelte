<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browserPersistence, type Persistence, type SavedSettings } from './storage';
  import { snapshots, type Snapshot } from './snapshots';
  import { activateTypeface, readTypeface, typefaces, type FontSlot, type Typeface } from './fonts';

  /** Mount keyed by tool slug; persist current design settings before saving a snapshot. */
  let { slug, persistence = browserPersistence(), accent = false, onload = () => {}, onfontchange = () => {} }: {
    slug: string;
    persistence?: Persistence;
    accent?: boolean;
    onload?: (settings: SavedSettings) => void;
    onfontchange?: (slot: FontSlot, font: Typeface | null) => void;
  } = $props();
  const library = untrack(() => snapshots(slug, persistence));
  const fonts = untrack(() => typefaces(slug, persistence));
  let entries = $state<Snapshot[]>([]);
  let name = $state('');
  let error = $state('');
  let busy = $state(true);
  let labels = $state<Record<FontSlot, string>>({ primary: 'system default', accent: 'system default' });
  const faces: Partial<Record<FontSlot, FontFace>> = {};
  let disposed = false;

  async function apply(slot: FontSlot, font: Typeface | null) {
    const face = font ? await activateTypeface(font) : undefined;
    if (disposed) { if (face) document.fonts.delete(face); return; }
    if (faces[slot]) document.fonts.delete(faces[slot]!);
    faces[slot] = face;
    labels[slot] = font?.file ?? 'system default';
    onfontchange(slot, font);
  }
  async function restoreFonts() {
    for (const slot of (accent ? ['primary', 'accent'] : ['primary']) as FontSlot[]) {
      await apply(slot, await fonts.load(slot));
    }
  }
  async function run(action: () => Promise<void>) {
    busy = true;
    error = '';
    try { await action(); }
    catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { busy = false; }
  }
  onMount(() => {
    void run(async () => { entries = await library.list(); await restoreFonts(); });
    return () => {
      disposed = true;
      for (const face of Object.values(faces)) if (face) document.fonts.delete(face);
    };
  });
  async function save() {
    await library.save(name);
    name = '';
    entries = await library.list();
  }
  async function load(snap: Snapshot) {
    const state = await library.load($state.snapshot(snap));
    await restoreFonts();
    onload(state);
  }
  async function upload(slot: FontSlot, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    await run(async () => {
      const font = await readTypeface(file);
      await apply(slot, font);
      await fonts.save(slot, font);
    });
  }
  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await run(async () => {
      await library.import(JSON.parse(await file.text()), message => window.confirm(message));
      entries = await library.list();
    });
    input.value = '';
  }
  async function exportFile() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(await library.export(), null, 1)], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `${slug}-snapshots.json` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
</script>

<section aria-label="Snapshots and typefaces">
  <fieldset disabled={busy}>
    <legend>Snapshots</legend>
    <form onsubmit={event => { event.preventDefault(); void run(save); }}>
      <label>Snapshot name <input bind:value={name} placeholder="name" /></label>
      <button type="submit">Save snapshot</button>
    </form>
    {#each entries as snap (snap.name)}
      <div>
        <span>{snap.name}</span>
        <button type="button" aria-label={`Load ${snap.name}`} onclick={() => run(() => load(snap))}>Load</button>
        <button type="button" aria-label={`Delete ${snap.name}`} onclick={() => run(async () => { await library.remove(snap.name); entries = await library.list(); })}>Delete</button>
      </div>
    {:else}<p>Nothing saved yet</p>{/each}
    <button type="button" onclick={() => run(exportFile)}>Export snapshots</button>
    <label>Import snapshots <input type="file" accept=".json,application/json" onchange={importFile} /></label>
    {#each (accent ? ['primary', 'accent'] : ['primary']) as slot}
      <label>{slot === 'primary' ? 'Primary typeface' : 'Accent typeface'}
        <input type="file" accept=".ttf,.otf,.woff,.woff2" onchange={event => upload(slot as FontSlot, event)} />
      </label>
      <span>{labels[slot as FontSlot]}</span>
      <button type="button" aria-label={`Clear ${slot} typeface`} onclick={() => run(async () => { await fonts.save(slot as FontSlot, null); await apply(slot as FontSlot, null); })}>System default</button>
    {/each}
  </fieldset>
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  fieldset { display: grid; gap: 0.5rem; }
  form, label { display: flex; gap: 0.5rem; align-items: center; }
  input { min-width: 0; }
</style>
