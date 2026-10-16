<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Asset, Dimensions, EvaluationInput, Frame } from '../engine/contracts';
  import { settingsStore, type Parameters, type Persistence } from './storage';
  import type { FontSlot, Typeface } from './fonts';
  import { imageAsset, type UploadedImage } from './images';
  import Controls from './Controls.svelte';
  import SnapshotsPanel from './SnapshotsPanel.svelte';
  import { boundedSize, clamp, controlSettings, latestEvaluation, resize, type EditorTool, type Handle } from './view';

  import ExportPanel from './ExportPanel.svelte';
  import type { ExportDestination, ExportHandlers } from './exports';

  let { tool, persistence, handlers, destination }: { tool: EditorTool; persistence: Persistence; handlers: ExportHandlers; destination: ExportDestination } = $props();
  const store = untrack(() => settingsStore(tool.id, persistence));
  const initial = untrack(() => store.load());
  const settings = (saved: Parameters) => controlSettings(tool.adapter.controls, tool.adapter.defaults, tool.prepareSettings?.(saved) ?? saved);
  let params = $state<Parameters>(untrack(() => {
    const params = settings(initial.params);
    // Opening an animated tool always enables its moving default, including
    // older saved settings with motion off. Snapshot restores remain literal.
    if (tool.playback && tool.adapter.capabilities.motion && params.motion === 'none') {
      params.motion = tool.adapter.defaults.motion;
    }
    return params;
  }));
  let view = $state<Parameters>(initial.view);
  // Replace assets as immutable values; keep byte identity stable across frames.
  let assets = $state.raw<Asset[]>([]);
  let displayed = $state<Frame<unknown>>();
  let busy = $state(true);
  let error = $state('');
  const previewStatus = $derived(busy ? 'updating' : error ? 'failed' : 'current');
  const previewMessage = $derived((busy
    ? `Updating full-detail preview — ${displayed ? 'showing previous artwork' : 'no artwork yet'}.`
    : error
      ? `Preview failed — ${displayed ? 'showing previous artwork' : 'no artwork available'}.`
      : 'Preview current — full detail.')
    + (displayed ? ` · ${displayed.dimensions.width} × ${displayed.dimensions.height}` : ''));
  let surface: HTMLDivElement;
  let renderTarget: HTMLDivElement | undefined;
  let container: HTMLDivElement;
  let stage: HTMLDivElement;
  let stageSize = $state({ width: 800, height: 600 });
  let space = $state(false);
  let pointer = $state<{ x: number; y: number }>();
  let timeSeconds = $state(0);
  let playing = $state(false);
  let playbackHandle = 0;
  let autoplayPending = untrack(() => Boolean(tool.playback && tool.adapter.capabilities.motion));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let wordDrag: { id: number; key: string; x: number; y: number; center: number[]; original: Parameters; moved: boolean } | undefined;
  function scenePoint(event: PointerEvent) {
    const rect = surface.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(playbackHandle);
  }
  function play() {
    autoplayPending = false;
    if (playing) { pause(); return; }
    if (params.motion === 'none') {
      params = { ...params, motion: tool.adapter.defaults.motion };
      persist();
    }
    playing = true;
    timeSeconds = 0;
    const origin = performance.now();
    const tick = (now: number) => {
      timeSeconds = (now - origin) / 1000;
      if (['draw in', 'grow in'].includes(String(params.motion)) && displayed && timeSeconds >= displayed.durationSeconds) {
        timeSeconds = displayed.durationSeconds;
        playing = false;
      }
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
  function imageChange(image: UploadedImage | null) {
    assets = [...assets.filter(asset => asset.role !== 'image'), ...(image ? [imageAsset(image)] : [])];
  }
  const evaluator = untrack(() => latestEvaluation<{ input: EvaluationInput<Parameters>; pointer?: { x: number; y: number } }, Frame<unknown>>(
    request => tool.preview ? tool.preview(request.input, request.pointer) : tool.adapter.evaluate(request.input),
    frame => {
      const target = tool.renderer.persistent && renderTarget ? renderTarget : document.createElement('div');
      try {
        tool.renderer.render(frame, target);
        if (target !== renderTarget) {
          if (renderTarget) tool.renderer.dispose?.(renderTarget);
          surface.replaceChildren(target);
          renderTarget = target;
        }
        displayed = frame;
        error = '';
        busy = false;
        if (autoplayPending) {
          autoplayPending = false;
          if (frame.durationSeconds > 0 && !reducedMotion.matches) play();
        }
      } catch (cause) {
        if (target !== renderTarget) tool.renderer.dispose?.(target);
        error = String(cause); busy = false;
      }
    },
    cause => { error = String(cause); busy = false; },
  ));
  const input: EvaluationInput<Parameters> = $derived.by(() => {
    return {
      design: { toolId: tool.adapter.id, params: $state.snapshot(params), seed: Number(params.seed) >>> 0,
        artboard: { mode: responsive ? 'responsive' : 'fixed', dimensions: { ...dimensions } }, assets },
      timeSeconds,
    };
  });
  $effect(() => {
    const request = { input, pointer };
    untrack(() => { busy = true; evaluator.request(request); });
  });
  $effect(() => {
    if (params.motion === 'none') untrack(() => { pause(); timeSeconds = 0; });
  });
  onMount(() => {
    persist();
    const motionPreferenceChanged = () => { if (reducedMotion.matches) pause(); };
    reducedMotion.addEventListener('change', motionPreferenceChanged);
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
    let restoreHandle = 0;
    const restored = () => {
      cancelAnimationFrame(restoreHandle);
      restoreHandle = requestAnimationFrame(() => {
        busy = true; evaluator.request({ input, pointer });
      });
    };
    surface.addEventListener('webglcontextrestored', restored, true);
    return () => {
      observer.disconnect(); evaluator.dispose(); cancelAnimationFrame(playbackHandle);
      reducedMotion.removeEventListener('change', motionPreferenceChanged);
      cancelAnimationFrame(restoreHandle);
      surface.removeEventListener('webglcontextrestored', restored, true);
      if (renderTarget) tool.renderer.dispose?.(renderTarget);
    };
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
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, select, textarea'))) return;
    if (event.code === 'Space' && target instanceof Element && target.closest('button, summary, a[href]')) return;
    if (event.code === 'Space') { event.preventDefault(); space = true; }
    if (event.key === 'Escape' && wordDrag) finishPointer(true);
    if (event.key === 'Escape' && drag) { if (drag.handle) setSize(drag.size); else setView({ pan: drag.pan }); drag = undefined; }
  }
</script>

<svelte:window onkeydown={keydown} onkeyup={event => { if (event.code === 'Space') space = false; }} onblur={() => { space = false; finishPointer(true); }} />
<div class="editor">
  <aside aria-label="Design controls">
    <div class="inspector-heading">
      <h2>{tool.name}</h2>
      <p>{tool.description}</p>
    </div>
    <div class="inspector-scroll">
    <Controls controls={tool.adapter.controls} defaults={tool.adapter.defaults} {params} {expandedGroups}
      onchange={setParam} onexpand={(group, open) => { if (expandedGroups.includes(group) !== open) setView({ expandedGroups: open ? [...expandedGroups, group] : expandedGroups.filter(g => g !== group) }); }} />
    <details class="ui-section">
      <summary>Artboard</summary>
      <div class="ui-section-body">
        {#if tool.adapter.capabilities.responsive}
          <label class="ui-row">Layout<select class="ui-select" aria-label="Layout" value={responsive ? 'responsive' : 'fixed'} onchange={event => setParam('responsive', event.currentTarget.value === 'responsive')}><option value="fixed">Fixed</option><option value="responsive">Responsive</option></select></label>
        {/if}
        {#if tool.artboard.dimensions || responsive}
          <label class="ui-row">{responsive ? 'Container width' : 'Width'}<input class="ui-input" type="number" min={tool.adapter.dimensions.width.min} max={tool.adapter.dimensions.width.max} value={dimensions.width} onchange={event => dimensionEdit('width', event)} /></label>
          <label class="ui-row">{responsive ? 'Container height' : 'Height'}<input class="ui-input" type="number" min={tool.adapter.dimensions.height.min} max={tool.adapter.dimensions.height.max} value={dimensions.height} onchange={event => dimensionEdit('height', event)} /></label>
        {/if}
        {#if tool.artboard.presets.length}
          <label class="ui-row">Aspect<select class="ui-select" aria-label="Aspect" value={aspect} onchange={preset}><option value="">Custom</option>{#each tool.artboard.presets as ratio}<option>{ratio}</option>{/each}</select></label>
        {/if}
        {#if tool.artboard.swap}<button class="ui-button swap" onclick={() => setSize({ width: dimensions.height, height: dimensions.width })}>Swap dimensions</button>{/if}
        {#if tool.artboard.ratioLock}<label class="ui-row">Lock ratio<input type="checkbox" checked={Boolean(params.lock)} onchange={event => setParam('lock', event.currentTarget.checked)} /></label>{/if}
      </div>
    </details>
    <SnapshotsPanel slug={tool.id} {persistence} accent={tool.accent} showTypefaces={tool.typefaces !== false} showImage={tool.image === true} prepareSettings={tool.prepareSettings} onfontchange={fontChange} onimagechange={imageChange}
      onload={saved => { params = settings(saved.params); persist(); }} />
    </div>
    <ExportPanel adapter={tool.adapter} {handlers} {input} {destination} {previewStatus} />
  </aside>
  <section aria-label="Composition preview">
    <div class="view-controls">
      <span class="canvas-label">Canvas</span>
      <span class="dimensions">{dimensions.width} <span>×</span> {dimensions.height} <span>px</span></span>
      <div class="view-actions">
        {#if tool.playback}<button class="ui-button quiet playback" aria-label={playing ? 'Pause motion' : 'Play motion'} onclick={play}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">{#if playing}<path d="M4 3h3v10H4zm5 0h3v10H9z"/>{:else}<path d="m5 3 8 5-8 5z"/>{/if}</svg>
          {playing ? 'Pause' : 'Play'}
        </button>{/if}
        <button class="ui-button quiet icon" aria-label="Reset pan" title="Center canvas" onclick={() => setView({ pan: { x: 0, y: 0 } })}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M5 2H2v3m9-3h3v3M2 11v3h3m9-3v3h-3"/><rect x="5.5" y="5.5" width="5" height="5" rx=".5"/></svg>
        </button>
        <label><span class="sr-only">Zoom</span><select class="ui-select zoom" aria-label="Zoom" value={view.zoom ?? 'fit'} onchange={event => setView({ zoom: event.currentTarget.value === 'fit' ? 'fit' : Number(event.currentTarget.value) })}>
          <option value="fit">Fit</option>{#each [...new Set([25, 50, 100, 200, 400, ...(typeof view.zoom === 'number' ? [view.zoom] : [])])] as value}<option value={value}>{Number(value.toFixed(1))}%</option>{/each}
        </select></label>
      </div>
    </div>
    <p class="sr-only" role="status" aria-label="Preview status">{playing ? (error ? 'Preview failed. Previous artwork may be retained.' : 'Motion playing. Full-detail preview updates continuously.') : previewMessage}</p>
    {#if error}<p class="preview-error ui-alert" role="alert">Last preview error: {error}</p>{/if}
    <div class="stage" class:panning={space} bind:this={stage} role="region" aria-label="Pan preview with Space and drag"
      onpointerleave={() => pointer = undefined} onpointerdown={event => { pointer = undefined; start(event); }} onpointermove={move} onpointerup={releasePointer} onpointercancel={() => { if (drag?.handle) setSize(drag.size); finishPointer(true); }}>
      <div class="container" bind:this={container} data-testid="preview-container"
        style:left={`${Math.max(24, (stageSize.width - dimensions.width * zoom) / 2)}px`}
        style:top={`${Math.max(24, (stageSize.height - dimensions.height * zoom) / 2)}px`}
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
    <footer class="canvas-footer">
      <p data-testid="preview-status" class:failed={Boolean(error)} title={previewMessage}>{previewMessage}</p>
      <span class="pan-hint"><kbd>Space</kbd> + drag to pan</span>
    </footer>
  </section>
</div>

<style>
  .editor { display: grid; grid-template-columns: 304px minmax(0, 1fr); flex: 1; min-height: 0; }
  aside { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: var(--ui-panel); border-right: 1px solid var(--ui-line); }
  .inspector-heading { flex: none; padding: 20px 16px 18px; }
  h2 { margin: 0 0 6px; font-size: 15px; font-weight: 600; letter-spacing: -.3px; }
  .inspector-heading p { margin: 0; max-width: 260px; font-size: 11px; line-height: 1.5; color: var(--ui-muted); }
  .inspector-scroll { flex: 1; min-height: 80px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: var(--ui-line) transparent; }
  .swap { justify-self: end; width: 156px; }
  section { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .view-controls { display: flex; flex: none; align-items: center; gap: 16px; height: 48px; padding: 0 20px; color: var(--ui-muted); }
  .canvas-label { font-size: 11px; font-weight: 500; }
  .dimensions { font: 10px var(--ui-mono); font-variant-numeric: tabular-nums; }
  .dimensions span { color: var(--ui-muted); }
  .view-actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
  .zoom { width: 72px; background-color: transparent; font-size: 11px; }
  .playback { font-size: 11px; }
  .preview-error { padding: 0 20px 8px; }
  .stage { position: relative; flex: 1; min-height: 0; overflow: hidden; }
  .stage.panning { cursor: grab; }
  .stage.panning:active { cursor: grabbing; }
  .container { position: absolute; transform-origin: top left; }
  .surface { background: white; box-shadow: 0 1px 3px #00000012, 0 8px 32px #00000008; }
  .handle { position: absolute; width: 12px; height: 12px; padding: 0; border: 1px solid var(--ui-muted); border-radius: 2px; background: var(--ui-panel); transform: translate(-50%, -50%); touch-action: none; opacity: 0; }
  .container:hover .handle, .container:focus-within .handle { opacity: 1; }
  .handle:hover, .handle:focus-visible { border-color: var(--ui-focus); }
  .canvas-footer { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 16px; height: 36px; padding: 0 20px; color: var(--ui-muted); font-size: 10px; }
  .canvas-footer p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; }
  .canvas-footer .failed { color: var(--ui-danger); }
  .pan-hint { flex: none; }
  kbd { font: inherit; border: 1px solid #cdcec7; border-radius: 3px; padding: 2px 4px; }
  @media (max-width: 900px) { .pan-hint { display: none; } .canvas-label { display: none; } }
  @media (hover: none) { .handle { opacity: 1; } }
  @media (max-width: 640px) {
    .editor { display: flex; flex-direction: column; }
    section { order: -1; flex: none; height: 52svh; min-height: 320px; }
    aside { height: 620px; max-height: 85svh; border-right: 0; border-top: 1px solid var(--ui-line); }
    .inspector-heading { padding: 16px; }
    .inspector-heading p { max-width: none; }
    .view-controls { padding: 0 12px; gap: 8px; height: 40px; }
    .canvas-footer { height: 28px; padding: 0 12px; }
  }
</style>
