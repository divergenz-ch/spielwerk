<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Asset, Dimensions, EvaluationInput, Frame } from '../engine/contracts';
  import { settingsStore, type Parameters, type Persistence } from './storage';
  import type { FontSlot, Typeface } from './fonts';
  import Controls from './Controls.svelte';
  import SnapshotsPanel from './SnapshotsPanel.svelte';
  import { boundedSize, clamp, controlSettings, latestEvaluation, resize, type EditorTool, type Handle } from './view';

  import ExportPanel from './ExportPanel.svelte';
  import type { ExportDestination, ExportHandlers } from './exports';

  let { tool, persistence, handlers, destination }: { tool: EditorTool; persistence: Persistence; handlers: ExportHandlers; destination: ExportDestination } = $props();
  const store = untrack(() => settingsStore(tool.id, persistence));
  const initial = untrack(() => store.load());
  const settings = (saved: Parameters) => controlSettings(tool.adapter.controls, tool.adapter.defaults, tool.prepareSettings?.(saved) ?? saved);
  let params = $state<Parameters>(untrack(() => settings(initial.params)));
  let view = $state<Parameters>(initial.view);
  let assets = $state<Asset[]>([]);
  let displayed = $state<Frame<unknown>>();
  let busy = $state(false);
  let error = $state('');
  let surface: HTMLDivElement;
  let container: HTMLDivElement;
  let stage: HTMLDivElement;
  let stageSize = $state({ width: 800, height: 600 });
  let space = $state(false);
  let pointer = $state<{ x: number; y: number }>();
  let timeSeconds = $state(0);
  let playing = $state(false);
  let playbackHandle = 0;
  let wordDrag: { id: number; key: string; x: number; y: number; center: number[]; original: Parameters; moved: boolean } | undefined;
  function scenePoint(event: PointerEvent) {
    const rect = surface.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
  }
  function play() {
    playing = !playing;
    cancelAnimationFrame(playbackHandle);
    if (!playing) return;
    timeSeconds = 0;
    const origin = performance.now();
    const tick = (now: number) => {
      timeSeconds = (now - origin) / 1000;
      if (params.motion === 'draw in' && displayed && timeSeconds >= displayed.durationSeconds) playing = false;
      if (playing) playbackHandle = requestAnimationFrame(tick);
    };
    playbackHandle = requestAnimationFrame(tick);
  }
  function finishPointer(cancel = false) {
    if (cancel && wordDrag) params = wordDrag.original;
    if (wordDrag) persist();
    wordDrag = undefined; drag = undefined;
    if (cancel) pointer = undefined;
  }
  async function releasePointer(event: PointerEvent) {
    const gesture = wordDrag;
    if (gesture && event.pointerId === gesture.id && tool.interaction?.release) {
      const point = scenePoint(event);
      const current = input;
      const moved = gesture.moved || Math.hypot(point.x - gesture.x, point.y - gesture.y) >= dimensions.width * 0.005;
      finishPointer();
      try {
        const patch = await tool.interaction.release(current, gesture.key, point.x, point.y, moved);
        // Do not apply a delayed gesture over a changed design or restored snapshot.
        if (JSON.stringify(input.design) === JSON.stringify(current.design)) { params = { ...params, ...patch }; persist(); }
      } catch (cause) { error = String(cause); }
      return;
    }
    finishPointer();
  }
  let drag: { id: number; x: number; y: number; scale: number; size: Dimensions; pan: { x: number; y: number }; handle?: Handle } | undefined;
  const responsive = $derived(tool.adapter.capabilities.responsive && Boolean(params.responsive));
  const fixed = $derived(boundedSize({ width: Number(params.wpx) || tool.artboard.initial.width, height: Number(params.hpx) || tool.artboard.initial.height }, tool.adapter.dimensions));
  const dimensions = $derived(responsive ? boundedSize({ width: Number(params.vw) || fixed.width, height: Number(params.vh) || fixed.height }, tool.adapter.dimensions) : fixed);
  const aspect = $derived(tool.artboard.presets.find(ratio => {
    const [width, height] = ratio.split(':').map(Number);
    return Math.abs(dimensions.height - dimensions.width * height / width) < 1;
  }) ?? '');
  const expandedGroups = $derived(Array.isArray(view.expandedGroups) ? view.expandedGroups as string[] : [...new Set(tool.adapter.controls.map(c => c.group))].filter(group => (view.open as Parameters | undefined)?.[group] !== false));
  const pan = $derived((view.pan as { x: number; y: number } | undefined) ?? { x: 0, y: 0 });
  const zoom = $derived(view.zoom === 'fit' || view.zoom === undefined ? Math.min(1, (stageSize.width - 48) / (displayed?.dimensions.width ?? dimensions.width), (stageSize.height - 48) / (displayed?.dimensions.height ?? dimensions.height)) : clamp(Number(view.zoom) || 100, 2, 800) / 100);

  function persist() { store.save($state.snapshot(params), $state.snapshot(view)); }
  function setParam(key: string, value: unknown) { params = { ...params, [key]: value }; persist(); }
  function setView(values: Parameters) { view = { ...view, ...values }; persist(); }
  function setSize(size: Dimensions) {
    const next = boundedSize(size, tool.adapter.dimensions);
    params = { ...params, ...(responsive ? { vw: next.width, vh: next.height } : { wpx: next.width, hpx: next.height }) };
    persist();
  }
  function dimensionEdit(axis: 'width' | 'height', event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isFinite(value) || !input.value) { input.value = String(dimensions[axis]); return; }
    setSize(resize(dimensions, axis === 'width' ? value : dimensions.width, axis === 'height' ? value : dimensions.height, tool.adapter.dimensions, Boolean(params.lock), axis));
    input.value = String(dimensions[axis]);
  }
  function preset(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (!value) return;
    const [w, h] = value.split(':').map(Number);
    setSize(resize({ width: w, height: h }, dimensions.width, dimensions.width * h / w, tool.adapter.dimensions, true));
  }
  function fontChange(slot: FontSlot, font: Typeface | null) {
    const role = slot === 'primary' ? 'typeface' : 'accent-typeface';
    const remaining = assets.filter(asset => asset.role !== role);
    if (font) {
      const [header, data] = font.dataURL.split(',');
      remaining.push({ id: slot, role, mediaType: header.slice(5).split(';')[0], bytes: Uint8Array.from(atob(data), c => c.charCodeAt(0)) });
    }
    assets = remaining;
  }
  const evaluator = untrack(() => latestEvaluation<{ input: EvaluationInput<Parameters>; pointer?: { x: number; y: number } }, Frame<unknown>>(
    request => tool.preview ? tool.preview(request.input, request.pointer) : tool.adapter.evaluate(request.input),
    frame => {
      try {
        const target = document.createElement('div');
        tool.renderer.render(frame, target);
        surface.replaceChildren(target);
        displayed = frame;
        busy = false;
      } catch (cause) { error = String(cause); busy = false; }
    },
    cause => { error = String(cause); busy = false; },
  ));
  const input: EvaluationInput<Parameters> = $derived.by(() => {
    return {
      design: { toolId: tool.adapter.id, params: $state.snapshot(params), seed: Number(params.seed) >>> 0,
        artboard: { mode: responsive ? 'responsive' : 'fixed', dimensions: { ...dimensions } }, assets: $state.snapshot(assets) },
      timeSeconds,
    };
  });
  $effect(() => {
    const request = { input, pointer };
    untrack(() => { busy = true; error = ''; evaluator.request(request); });
  });
  onMount(() => {
    persist();
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (entry.target === stage) stageSize = { width, height };
        else if (responsive && width > 0 && height > 0) {
          const next = boundedSize({ width, height }, tool.adapter.dimensions);
          if (next.width !== dimensions.width || next.height !== dimensions.height) setSize(next);
        }
      }
    });
    observer.observe(stage);
    observer.observe(container);
    return () => { observer.disconnect(); evaluator.dispose(); cancelAnimationFrame(playbackHandle); };
  });
  function start(event: PointerEvent, handle?: Handle) {
    if (event.button !== 0) return;
    if (!handle && !space && displayed && tool.interaction) {
      const point = scenePoint(event);
      const hit = tool.interaction.hit(displayed, point.x, point.y, event.target);
      if (hit) {
        event.preventDefault(); event.stopPropagation();
        if (tool.interaction.click) { params = tool.interaction.click(params, hit.key); persist(); }
        if (tool.interaction.drag || tool.interaction.release) {
          wordDrag = { id: event.pointerId, key: hit.key, center: hit.center, x: point.x, y: point.y, original: $state.snapshot(params), moved: false };
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }
      }
      return;
    }
    if (!handle && !space) return;
    event.preventDefault(); event.stopPropagation();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scale: zoom, size: { ...dimensions }, pan: { ...pan }, handle };
    if (handle && (view.zoom === 'fit' || view.zoom === undefined)) setView({ zoom: zoom * 100 });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (tool.preview) {
      const point = scenePoint(event);
      pointer = !space && !drag && point.x >= 0 && point.y >= 0 && point.x <= dimensions.width && point.y <= dimensions.height ? point : undefined;
    }
    if (wordDrag && event.pointerId === wordDrag.id && tool.interaction?.release) {
      const point = scenePoint(event);
      wordDrag.moved ||= Math.hypot(point.x - wordDrag.x, point.y - wordDrag.y) >= dimensions.width * 0.005;
      return;
    }
    if (wordDrag && event.pointerId === wordDrag.id && tool.interaction?.drag) {
      const point = scenePoint(event);
      params = tool.interaction.drag(params, wordDrag.key,
        clamp((wordDrag.center[0] + point.x - wordDrag.x) / dimensions.width, 0, 1),
        clamp((wordDrag.center[1] + point.y - wordDrag.y) / dimensions.height, 0, 1));
      return;
    }
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.handle) { setView({ pan: { x: drag.pan.x + event.clientX - drag.x, y: drag.pan.y + event.clientY - drag.y } }); return; }
    const handle = drag.handle;
    const dx = (event.clientX - drag.x) / drag.scale;
    const dy = (event.clientY - drag.y) / drag.scale;
    setSize(resize(drag.size, drag.size.width + (handle.includes('e') ? dx : handle.includes('w') ? -dx : 0), drag.size.height + (handle.includes('s') ? dy : handle.includes('n') ? -dy : 0), tool.adapter.dimensions, Boolean(params.lock) || event.shiftKey, /[ew]/.test(handle) ? 'width' : 'height'));
  }
  function nudge(handle: Handle, event: KeyboardEvent) {
    const deltas: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    if (!deltas[event.key]) return;
    event.preventDefault();
    const [x, y] = deltas[event.key].map(n => n * (event.shiftKey ? 10 : 1));
    setSize(resize(dimensions, dimensions.width + (handle.includes('e') ? x : handle.includes('w') ? -x : 0), dimensions.height + (handle.includes('s') ? y : handle.includes('n') ? -y : 0), tool.adapter.dimensions, Boolean(params.lock), /[ew]/.test(handle) ? 'width' : 'height'));
  }
  function keydown(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, select, textarea, button, summary, a[href]'))) return;
    if (event.code === 'Space') { event.preventDefault(); space = true; }
    if (event.key === 'Escape' && wordDrag) finishPointer(true);
    if (event.key === 'Escape' && drag) { if (drag.handle) setSize(drag.size); else setView({ pan: drag.pan }); drag = undefined; }
  }
</script>

<svelte:window onkeydown={keydown} onkeyup={event => { if (event.code === 'Space') space = false; }} onblur={() => { space = false; finishPointer(true); }} />
<div class="editor">
  <aside aria-label="Design controls">
    <Controls controls={tool.adapter.controls} defaults={tool.adapter.defaults} {params} {expandedGroups}
      onchange={setParam} onexpand={(group, open) => { if (expandedGroups.includes(group) !== open) setView({ expandedGroups: open ? [...expandedGroups, group] : expandedGroups.filter(g => g !== group) }); }} />
    <fieldset>
      <legend>Artboard</legend>
      {#if tool.adapter.capabilities.responsive}
        <label>Layout<select aria-label="Layout" value={responsive ? 'responsive' : 'fixed'} onchange={event => setParam('responsive', event.currentTarget.value === 'responsive')}><option value="fixed">Fixed</option><option value="responsive">Responsive</option></select></label>
      {/if}
      {#if tool.artboard.dimensions || responsive}
        <label>{responsive ? 'Container width' : 'Width'}<input type="number" min={tool.adapter.dimensions.width.min} max={tool.adapter.dimensions.width.max} value={dimensions.width} onchange={event => dimensionEdit('width', event)} /></label>
        <label>{responsive ? 'Container height' : 'Height'}<input type="number" min={tool.adapter.dimensions.height.min} max={tool.adapter.dimensions.height.max} value={dimensions.height} onchange={event => dimensionEdit('height', event)} /></label>
      {/if}
      {#if tool.artboard.presets.length}
        <label>Aspect<select aria-label="Aspect" value={aspect} onchange={preset}><option value="">Custom</option>{#each tool.artboard.presets as ratio}<option>{ratio}</option>{/each}</select></label>
      {/if}
      {#if tool.artboard.swap}<button onclick={() => setSize({ width: dimensions.height, height: dimensions.width })}>Swap dimensions</button>{/if}
      {#if tool.artboard.ratioLock}<label>Lock ratio<input type="checkbox" checked={Boolean(params.lock)} onchange={event => setParam('lock', event.currentTarget.checked)} /></label>{/if}
    </fieldset>
    <ExportPanel adapter={tool.adapter} {handlers} {input} {destination} />
    <SnapshotsPanel slug={tool.id} {persistence} accent={tool.accent} prepareSettings={tool.prepareSettings} onfontchange={fontChange}
      onload={saved => { params = settings(saved.params); persist(); }} />
  </aside>
  <section aria-label="Composition preview">
    <label>Zoom<select aria-label="Zoom" value={view.zoom ?? 'fit'} onchange={event => setView({ zoom: event.currentTarget.value === 'fit' ? 'fit' : Number(event.currentTarget.value) })}>
      <option value="fit">Fit</option>{#each [...new Set([25, 50, 100, 200, 400, ...(typeof view.zoom === 'number' ? [view.zoom] : [])])] as value}<option value={value}>{value}%</option>{/each}
    </select></label>
    <button onclick={() => setView({ pan: { x: 0, y: 0 } })}>Reset pan</button>
    {#if tool.playback}<button onclick={play}>{playing ? 'Pause motion' : 'Play motion'}</button>{/if}
    <p role="status">{busy ? 'Updating full-detail preview…' : 'Full-detail preview'}{#if displayed} · {displayed.dimensions.width} × {displayed.dimensions.height}{/if}</p>
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="stage" bind:this={stage} role="region" aria-label="Pan preview with Space and drag"
      onpointerleave={() => pointer = undefined} onpointerdown={event => { pointer = undefined; start(event); }} onpointermove={move} onpointerup={releasePointer} onpointercancel={() => { if (drag?.handle) setSize(drag.size); finishPointer(true); }}>
      <div class="container" bind:this={container} data-testid="preview-container"
        style:width={`${dimensions.width}px`} style:height={`${dimensions.height}px`}
        style:min-width={`${tool.adapter.dimensions.width.min}px`} style:max-width={`${tool.adapter.dimensions.width.max}px`}
        style:min-height={`${tool.adapter.dimensions.height.min}px`} style:max-height={`${tool.adapter.dimensions.height.max}px`}
        style:transform={`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}>
        <div class="surface" bind:this={surface} data-testid="scene" style:width={`${displayed?.dimensions.width ?? dimensions.width}px`} style:height={`${displayed?.dimensions.height ?? dimensions.height}px`}></div>
        {#each tool.artboard.handles as handle}
          <button class="handle" aria-label={`Resize artboard ${handle}`} style:left={handle.includes('w') ? '0%' : handle.includes('e') ? '100%' : '50%'} style:top={handle.includes('n') ? '0%' : handle.includes('s') ? '100%' : '50%'}
            onpointerdown={event => start(event, handle)} onpointermove={move} onpointerup={() => drag = undefined} onpointercancel={() => { if (drag) setSize(drag.size); drag = undefined; }} onkeydown={event => nudge(handle, event)}></button>
        {/each}
      </div>
    </div>
  </section>
</div>

<style>
  .editor { display: grid; grid-template-columns: 24rem minmax(0, 1fr); gap: 1.5rem; }
  aside { max-height: 85vh; overflow: auto; }
  fieldset { display: grid; gap: .5rem; margin: 1rem 0; }
  label { display: flex; gap: .5rem; align-items: center; }
  input[type=number] { width: 6rem; }
  .stage { height: 65vh; min-height: 300px; overflow: auto; background: #d6d4cf; padding: 24px; }
  .container { position: relative; transform-origin: top left; }
  .surface { background: white; }
  .handle { position: absolute; width: 12px; height: 12px; padding: 0; border: 1px solid #2463cf; background: white; transform: translate(-50%, -50%); touch-action: none; }
</style>
