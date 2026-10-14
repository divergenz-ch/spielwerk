<script lang="ts">
  import { onMount } from 'svelte';
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
    <h1>Spielwerk</h1>
    {#if selected}
      <div class="identity">
        <h2>{selected.name}</h2>
        <p>{selected.description}</p>
      </div>
    {/if}
    <nav aria-label="Tools">
      <label>Tool<select value={selected?.id} onchange={event => { location.hash = event.currentTarget.value; hash = location.hash; }}>
        {#each catalog as tool}<option value={tool.id}>{tool.name}</option>{/each}
      </select></label>
      {#if selected}<a href={`#${selected.id}`}>Link to {selected.name}</a>{/if}
    </nav>
  </header>
  {#if selected}
    {#if selected.status === 'ready'}
      {#key selected.id}<Artboard tool={selected} {persistence} handlers={exporters[selected.id] ?? {}} {destination} />{/key}
    {:else}
      <section aria-labelledby="workspace-heading">
        <h2 id="workspace-heading">Workspace foundation</h2>
        <p>The browser workspace is ready. Design tools are not available yet.</p>
      </section>
    {/if}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #e9e7e2;
    color: #1c1c1c;
    font: 16px/1.5 system-ui, sans-serif;
  }

  main { box-sizing: border-box; height: 100dvh; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
  header { display: flex; align-items: center; gap: 1.5rem; }
  h1 { font-size: 1rem; }
  h2 { font-size: 1.25rem; }
  h1, h2, p { margin: 0; }
  .identity { flex: 1; min-width: 0; }
  .identity p, nav { font-size: .875rem; }
  nav { display: grid; gap: .25rem; }
  select { margin-left: .5rem; max-width: 100%; }
  section { padding: 1rem 0; }

  @media (max-width: 48rem) {
    main { height: auto; min-height: 100dvh; }
    header { flex-wrap: wrap; gap: .75rem; }
    .identity { flex-basis: calc(100% - 8rem); }
    nav { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
  }
</style>
