<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browserPersistence, type Persistence, type SavedSettings, type Parameters } from './storage';
  import { snapshots, type Snapshot } from './snapshots';
  import { activateTypeface, readTypeface, typefaces, type FontSlot, type Typeface } from './fonts';
  import { images, readImage, validateImage, type UploadedImage } from './images';

  /** Mount keyed by tool slug; persist current design settings before saving a snapshot. */
  let { slug, persistence = browserPersistence(), accent = false, showTypefaces = true, showImage = false, prepareSettings, onload = () => {}, onfontchange = () => {}, onimagechange = () => {} }: {
    slug: string;
    persistence?: Persistence;
    accent?: boolean;
    showTypefaces?: boolean;
    showImage?: boolean;
    onimagechange?: (image: UploadedImage | null) => void;
    prepareSettings?: (params: Parameters) => Parameters;
    onload?: (settings: SavedSettings) => void;
    onfontchange?: (slot: FontSlot, font: Typeface | null) => void;
  } = $props();
  const library = untrack(() => snapshots(slug, persistence));
  const fonts = untrack(() => typefaces(slug, persistence));
  const imageStore = untrack(() => images(slug, persistence));
  let image = $state.raw<UploadedImage | null>(null);
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
    if (!showTypefaces) return;
    for (const slot of (accent ? ['primary', 'accent'] : ['primary']) as FontSlot[]) {
      await apply(slot, await fonts.load(slot));
    }
  }
  async function applyImage(next: UploadedImage | null) {
    await validateImage(next);
    if (disposed) return;
    image = next;
    onimagechange(next);
  }
  async function restoreImage() {
    if (showImage) await applyImage(await imageStore.load());
  }
  async function uploadImage(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await run(async () => {
      const next = await readImage(file);
      await imageStore.save(next);
      await applyImage(next);
    });
  }
  async function run(action: () => Promise<void>) {
    busy = true;
    error = '';
    try { await action(); }
    catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { busy = false; }
  }
  onMount(() => {
    void run(async () => { entries = await library.list(); await restoreFonts(); await restoreImage(); });
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
    const snapshot = $state.snapshot(snap);
    const state = await library.load({ ...snapshot, params: prepareSettings?.(snapshot.params) ?? snapshot.params });
    await restoreFonts();
    await restoreImage();
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

<section aria-label={showTypefaces ? "Snapshots and typefaces" : showImage ? "Snapshots and image" : "Snapshots"}>
  {#if showImage}
    <details class="ui-section" open>
      <summary>Image</summary>
      <fieldset class="ui-section-body" aria-label="Shader image" disabled={busy}>
        <label class="file-label">Upload image
          <input class="ui-file" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onchange={uploadImage} />
        </label>
        <p class="ui-note">PNG, JPEG, or WebP · up to 10 MB and 4096 × 4096 px. Processed in your browser.</p>
        {#if image}
          <img class="image-preview" src={image.dataURL} alt="Uploaded shader source" />
          <div class="font-status">
            <span title={image.file}>{image.file}</span>
            <button class="ui-button quiet" type="button" aria-label="Remove image" onclick={() => run(async () => { await imageStore.save(null); await applyImage(null); })}>Remove</button>
          </div>
          <p class="ui-note">Distortion warps the image. Image mix blends it with the palette.</p>
        {:else}
          <p class="ui-note">No image — using the gradient palette.</p>
        {/if}
      </fieldset>
    </details>
  {/if}
  <details class="ui-section">
    <summary>Snapshots</summary>
    <fieldset class="ui-section-body" disabled={busy} aria-label="Snapshot management">
      <form onsubmit={event => { event.preventDefault(); void run(save); }}>
        <label class="sr-only" for={`snapshot-name-${slug}`}>Snapshot name</label>
        <input class="ui-input" id={`snapshot-name-${slug}`} bind:value={name} placeholder="Name this version…" />
        <button class="ui-button" type="submit" aria-label="Save snapshot">Save</button>
      </form>
      {#each entries as snap (snap.name)}
        <div class="snapshot-row">
          <span title={snap.name}>{snap.name}</span>
          <button class="ui-button quiet" type="button" aria-label={`Load ${snap.name}`} onclick={() => run(() => load(snap))}>Load</button>
          <button class="ui-button quiet icon" type="button" aria-label={`Delete ${snap.name}`} title={`Delete ${snap.name}`} onclick={() => run(async () => { await library.remove(snap.name); entries = await library.list(); })}>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="m5 5 6 6m0-6-6 6"/></svg>
          </button>
        </div>
      {:else}<p class="ui-note empty">Nothing saved yet</p>{/each}
      <button class="ui-button" type="button" onclick={() => run(exportFile)}>Export snapshots</button>
      <label class="file-label">Import snapshots <input class="ui-file" type="file" accept=".json,application/json" onchange={importFile} /></label>
    </fieldset>
  </details>
  {#if showTypefaces}
  <details class="ui-section" open>
    <summary>Typefaces</summary>
    <fieldset class="ui-section-body" aria-label="Typefaces" disabled={busy}>
      {#each (accent ? ['primary', 'accent'] : ['primary']) as slot}
        <div class="typeface">
          <label class="file-label">{slot === 'primary' ? 'Primary typeface' : 'Accent typeface'}
            <input class="ui-file" type="file" accept=".ttf,.otf,.woff,.woff2" onchange={event => upload(slot as FontSlot, event)} />
          </label>
          <div class="font-status">
            <span title={labels[slot as FontSlot]}>{labels[slot as FontSlot]}</span>
            <button class="ui-button quiet" type="button" aria-label={`Clear ${slot} typeface`} onclick={() => run(async () => { await fonts.save(slot as FontSlot, null); await apply(slot as FontSlot, null); })}>Reset</button>
          </div>
        </div>
      {/each}
    </fieldset>
  </details>
  {/if}
  {#if error}<p class="ui-alert error" role="alert">{error}</p>{/if}
</section>

<style>
  form { display: flex; align-items: center; gap: 5px; }
  form input { flex: 1; }
  .snapshot-row { display: flex; gap: 4px; align-items: center; min-width: 0; }
  .snapshot-row > span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .snapshot-row button { flex: none; font-size: 11px; }
  .empty { padding: 8px 0; }
  .file-label { display: grid; gap: 6px; margin-top: 6px; font-size: 11px; color: var(--ui-muted); }
  .font-status { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--ui-muted); font-size: 10px; }
  .font-status span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .font-status button { flex: none; font-size: 10px; height: 24px; }
  .image-preview { display: block; width: 100%; max-height: 120px; object-fit: contain; border-radius: 3px; }
  .error { padding: 0 16px 14px; }
</style>
