<script lang="ts">
  import { onMount } from 'svelte';
  import './workspace.css';
  import { tools } from './registry';
  import { browserPersistence, type Persistence } from './storage';
  import { selectedTool, type CatalogEntry } from './view';
  import Artboard from './Artboard.svelte';
  import { exportDestination, type Exporters } from './exports';
  let { catalog = tools, persistence = browserPersistence(), exporters = {} }: {
    catalog?: readonly CatalogEntry[]; persistence?: Persistence; exporters?: Exporters;
  } = $props();
  const destination = exportDestination();
  let hash = $state(location.hash);
  const selected = $derived(selectedTool(catalog, hash));
  onMount(() => {
    const change = () => { hash = location.hash; };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  });
</script>

<main>
  <header>
    <h1>
      <svg class="mark" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="12" y="2" width="6" height="6" rx="3"/><rect x="2" y="12" width="6" height="6" rx="3"/><rect x="12" y="12" width="6" height="6" rx="1"/></svg>
      Spielwerk
    </h1>
    <nav aria-label="Tools">
      <label><span class="sr-only">Tool</span><select class="ui-select" value={selected?.id} onchange={event => { location.hash = event.currentTarget.value; hash = location.hash; }}>
        {#each catalog as tool}<option value={tool.id}>{tool.name}</option>{/each}
      </select></label>
      {#if selected}<a class="ui-button quiet" href={`#${selected.id}`} aria-label={`Link to ${selected.name}`} title={`Link to ${selected.name}`}>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="m6 10 4-4M6.5 4.5l1-1a3 3 0 0 1 4.2 4.2l-1 1m-1.2 2.8-1 1a3 3 0 0 1-4.2-4.2l1-1"/></svg>
        <span>Tool link</span>
      </a>{/if}
    </nav>
  </header>
  {#if selected}
    {#if selected.status === 'ready'}
      {#key selected.id}<Artboard tool={selected} {persistence} handlers={exporters[selected.id] ?? {}} {destination} />{/key}
    {:else}
      <section aria-labelledby="workspace-heading">
        <h2>{selected.name}</h2>
        <p>{selected.description}</p>
        <h3 id="workspace-heading">Workspace foundation</h3>
        <p>The browser workspace is ready. Design tools are not available yet.</p>
      </section>
    {/if}
  {/if}
</main>

<style>
  main { height: 100dvh; display: flex; flex-direction: column; }
  header { display: flex; align-items: center; flex: none; height: 48px; padding: 0 16px; gap: 20px; background: var(--ui-panel); border-bottom: 1px solid var(--ui-line); }
  h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; font-weight: 600; letter-spacing: -.3px; }
  .mark { width: 18px; height: 18px; }
  nav { display: flex; flex: 1; min-width: 0; align-items: center; justify-content: space-between; border-left: 1px solid var(--ui-line); padding-left: 16px; }
  nav select { width: 160px; background-color: transparent; font-weight: 500; }
  nav select:hover { background-color: var(--ui-field); }
  section { padding: 40px; line-height: 1.6; }
  h2 { font-size: 18px; font-weight: 500; }
  h3 { margin-top: 32px; font-size: 12px; }
  p { color: var(--ui-muted); }
  @media (max-width: 640px) {
    main { height: auto; min-height: 100dvh; }
    header { padding: 0 12px; gap: 12px; }
    nav { padding-left: 10px; }
    nav select { width: 144px; }
    nav a { width: 28px; padding: 0; }
    nav a span { display: none; }
  }
</style>
