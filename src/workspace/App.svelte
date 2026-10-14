<script lang="ts">
  import { onMount } from 'svelte';
  import { tools } from './registry';
  import { browserPersistence, type Persistence } from './storage';
  import { selectedTool, type CatalogEntry } from './view';
  import Artboard from './Artboard.svelte';
  let { catalog = tools, persistence = browserPersistence() }: {
    catalog?: readonly CatalogEntry[]; persistence?: Persistence;
  } = $props();
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
    <p>Design workspace</p>
  </header>
  <nav aria-label="Tools">
    <label>Tool<select value={selected?.id} onchange={event => { location.hash = event.currentTarget.value; hash = location.hash; }}>
      {#each catalog as tool}<option value={tool.id}>{tool.name}</option>{/each}
    </select></label>
    {#if selected}<a href={`#${selected.id}`}>Link to {selected.name}</a>{/if}
  </nav>
  {#if selected}
    <h2>{selected.name}</h2>
    <p>{selected.description}</p>
    {#if selected.status === 'ready'}
      {#key selected.id}<Artboard tool={selected} {persistence} />{/key}
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

  main { padding: 2rem; }
  nav { display: flex; gap: 1rem; margin-bottom: 1rem; }
  select { margin-left: .5rem; }

  h1,
  h2 {
    margin: 0;
  }

  header {
    margin-bottom: 2rem;
  }

  section {
    background: #fff;
    padding: 2rem;
    border-radius: 0.5rem;
  }
</style>
