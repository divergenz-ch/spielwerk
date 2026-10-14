import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });

test('switchboard: Rust state transitions, linked influence, order, responsive layout and bounds', async ({ page }) => {
  await page.goto(url + '#switchboard');
  const result = await page.evaluate(async () => {
    const { adapter, act } = await import('/src/tools/switchboard.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, cols: 12, rows: 16, links: 60 }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 600, height: 800 } }, assets: [] }, timeSeconds: 0 };
    const first = await adapter.evaluate(input), repeat = await adapter.evaluate(input);
    const transitions = [];
    for (const cell of first.scene.cells) {
      const next = await act(input, { kind: 'click', id: cell.id });
      const state = next.scene.states[cell.id];
      const states = Array(first.scene.cells.length).fill(0); states[cell.id] = 0.75;
      const fullInput = { ...input, design: { ...input.design, params: { ...input.design.params, st: states } } };
      const full = await act(fullInput, { kind: 'click', id: cell.id });
      transitions.push({ kind: cell.kind, state, fullState: full.scene.states[cell.id], changed: (state === 1 ? next : full).scene.svg !== first.scene.svg });
      for (const [a, b] of next.scene.links) if (a === cell.id && next.scene.states[b] !== state) throw Error('copy propagation');
    }
    const linked = first.scene.links[0];
    const initialStates = Array(first.scene.cells.length).fill(0);
    if (!['button', 'toggle', 'checkbox', 'led', 'chip', 'field', 'dropdown'].includes(first.scene.cells[linked[0]].kind)) initialStates[linked[0]] = 0.75;
    const active = await act({ ...input, design: { ...input.design, params: { ...input.design.params, st: initialStates } } }, { kind: 'click', id: linked[0] });
    input.design.params = { ...input.design.params, st: active.scene.states };
    const still = await adapter.evaluate(input); input.timeSeconds = 0.3; const later = await adapter.evaluate(input);
    const swapped = await act(input, { kind: 'swap', id: 0, x: first.scene.cells[1].x, y: first.scene.cells[1].y });
    const outside = await act(input, { kind: 'swap', id: 0, x: -1, y: 0 });
    input.design.artboard.dimensions = { width: 800, height: 600 }; const resized = await adapter.evaluate(input);
    const invalid = [];
    for (const width of [99, 8001]) { input.design.artboard.dimensions.width = width; try { await adapter.evaluate(input); } catch (e) { invalid.push(String(e)); } }
    input.design.artboard.dimensions.width = 600; input.timeSeconds = -1; try { await adapter.evaluate(input); } catch (e) { invalid.push(String(e)); }
    return { same: JSON.stringify(first) === JSON.stringify(repeat), transitions, active, still, later, swapped, outside, resized, first, invalid };
  });
  expect(result.same).toBe(true);
  expect(new Set(result.transitions.map(t => t.kind)).size).toBe(19);
  for (const t of result.transitions) { expect(t.state).toBe(['button', 'toggle', 'checkbox', 'led', 'chip', 'field', 'dropdown'].includes(t.kind) ? 1 : 0.25); expect(t.fullState).toBe(['button', 'toggle', 'checkbox', 'led', 'chip', 'field', 'dropdown'].includes(t.kind) ? 0 : 1); expect(t.changed).toBe(true); }
  expect(result.active.scene.cells.some(c => c.influence > 0)).toBe(true);
  expect(result.still.scene.svg).not.toBe(result.later.scene.svg);
  expect(result.still.scene.motionSvg).toContain('<animate');
  expect(result.swapped.scene.order.slice(0, 2)).toEqual([1, 0]);
  expect(result.outside.scene.order).toEqual(result.first.scene.order);
  expect(result.resized.scene.cells[0].x).not.toBe(result.first.scene.cells[0].x);
  expect(result.invalid).toHaveLength(3);
});

test('switchboard: workspace click, outside, swap, cancel, font, playback and responsive artwork', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(url + '#switchboard');
  const scene = page.getByTestId('scene');
  await expect(scene.locator('[data-widget]').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('responsive');
  for (const [label, value] of [['Container width', '400'], ['Container height', '300']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
  await expect(scene.locator('svg')).toHaveAttribute('viewBox', '0 0 400 300');
  const first = scene.locator('[data-widget="0"]');
  const before = await scene.innerHTML();
  await scene.locator('svg').click({ position: { x: 10, y: 10 } });
  expect(await scene.innerHTML()).toBe(before);
  await first.click();
  await expect.poll(() => scene.innerHTML()).not.toBe(before);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('switchboard')!));
  expect(saved.st[0]).toBeGreaterThan(0);
  const a = (await first.boundingBox())!, b = (await scene.locator('[data-widget="1"]').boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('switchboard')!).order?.slice(0, 2))).toEqual([1, 0]);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('switchboard')!))).st).toEqual(saved.st);
  const stored = await page.evaluate(() => localStorage.getItem('switchboard'));
  // Crossing the dead zone remains a drag even after returning to its start.
  const origin = (await first.boundingBox())!;
  const ox = origin.x + origin.width / 2, oy = origin.y + origin.height / 2;
  await page.mouse.move(ox, oy); await page.mouse.down();
  await page.mouse.move(ox + 50, oy + 30, { steps: 5 }); await page.mouse.move(ox, oy, { steps: 5 }); await page.mouse.up();
  await expect(page.getByRole('status').filter({ hasText: 'Full-detail preview' })).toContainText('400 × 300');
  expect(await page.evaluate(() => localStorage.getItem('switchboard'))).toBe(stored);
  await first.hover(); await page.mouse.down(); await page.mouse.move(a.x, a.y); await page.keyboard.press('Escape'); await page.mouse.up();
  expect(await page.evaluate(() => localStorage.getItem('switchboard'))).toBe(stored);
  for (const [label, value] of [['Cycle seconds exact', '1'], ['GIF fps exact', '5']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
  // Activate an actual wire source so flow has visible moving dashes.
  await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/switchboard.ts');
    const p = JSON.parse(localStorage.getItem('switchboard')!); const input = { design: { toolId: adapter.id, params: p, seed: p.seed, artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds: 0 };
    const frame = await adapter.evaluate(input); const states = Array(frame.scene.cells.length).fill(1); localStorage.setItem('switchboard', JSON.stringify({ ...p, st: states }));
  });
  await page.reload(); await expect(scene.locator('[data-widget]').first()).toBeVisible();
  await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'outline.ttf', mimeType: 'font/ttf', buffer: await readFile('tests/generators/fixtures/outline.ttf') });
  await expect(scene.locator('text')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play motion', exact: true }).click(); const staticFrame = await scene.innerHTML(); await expect.poll(() => scene.innerHTML()).not.toBe(staticFrame); await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  for (const format of ['svg', 'png', 'gif']) {
    await page.getByRole('combobox', { name: 'Output format' }).selectOption(format);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
    const download = await pending, bytes = await readFile((await download.path())!);
    expect(download.suggestedFilename()).toBe(`switchboard.${format}`);
    if (format === 'svg') { expect(bytes.toString()).toContain('<animate'); expect(bytes.toString()).toContain('viewBox="0 0 400 300"'); expect(bytes.toString()).not.toMatch(/data-widget|onpointer|script/); }
    else {
      const decoded = await page.evaluate(async ({ bytes, format }) => {
        const decoder = new (window as any).ImageDecoder({ data: Uint8Array.from(bytes), type: `image/${format}` }); await decoder.tracks.ready; const count = decoder.tracks.selectedTrack.frameCount;
        const first = (await decoder.decode({ frameIndex: 0 })).image;
        const canvas = Object.assign(document.createElement('canvas'), { width: first.displayWidth, height: first.displayHeight }); const ctx = canvas.getContext('2d')!; ctx.drawImage(first, 0, 0); const a = [...ctx.getImageData(0, 0, canvas.width, canvas.height).data]; first.close();
        let different = false; if (count > 1) { const last = (await decoder.decode({ frameIndex: count - 1 })).image; ctx.drawImage(last, 0, 0); const b = ctx.getImageData(0, 0, canvas.width, canvas.height).data; different = a.some((v, i) => v !== b[i]); last.close(); }
        decoder.close(); return { count, width: canvas.width, height: canvas.height, different, colors: new Set(a).size };
      }, { bytes: [...bytes], format });
      expect(decoded.width).toBe(400); expect(decoded.height).toBe(300); expect(decoded.colors).toBeGreaterThan(2); expect(decoded.count).toBe(format === 'gif' ? 5 : 1); if (format === 'gif') expect(decoded.different).toBe(true);
    }
  }
});

test('switchboard: pixel saves migrate once and relative decoration scales with the board', async ({ page }) => {
  await page.goto(url + '#switchboard');
  const result = await page.evaluate(async () => {
    const { adapter, switchboard } = await import('/src/tools/switchboard.ts');
    const legacy = { wpx: 1500, hpx: 2000, stroke: 6, radius: 8, shadow: 10, wirepx: 4, seed: 7, st: [1, 0.25], order: [1, 0] };
    const migrated = switchboard.prepareSettings!(legacy), twice = switchboard.prepareSettings!(migrated);
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, ...migrated }, seed: 7, artboard: { mode: 'responsive', dimensions: { width: 600, height: 800 } }, assets: [] }, timeSeconds: 0.25 };
    const first = await adapter.evaluate(input);
    input.design.artboard.dimensions = { width: 1200, height: 1600 }; const doubled = await adapter.evaluate(input);
    const read = (svg: string) => {
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      return { stroke: Number(doc.querySelector('svg > g')!.getAttribute('stroke-width')), wire: Number(doc.querySelector('svg > path')!.getAttribute('stroke-width')), radius: Number(doc.querySelector('[data-widget] rect')!.getAttribute('rx')) };
    };
    localStorage.setItem('switchboard', JSON.stringify(legacy));
    return { migrated, twice, first: read(first.scene.svg), doubled: read(doubled.scene.svg) };
  });
  expect(result.migrated.rel).toBe(1); expect(result.migrated.stroke).toBe(0.4);
  expect(result.migrated.radius).toBeCloseTo(8 / 15); expect(result.migrated.shadow).toBeCloseTo(10 / 15); expect(result.migrated.wirepx).toBeCloseTo(4 / 15);
  expect(result.twice).toEqual(result.migrated); expect(result.migrated.st).toEqual([1, 0.25]); expect(result.migrated.order).toEqual([1, 0]);
  for (const key of ['stroke', 'wire', 'radius'] as const) { expect(result.first[key]).toBeGreaterThan(0); expect(result.doubled[key]).toBeCloseTo(result.first[key] * 2); }
  await page.reload(); await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('0.4');
  await page.reload(); await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('0.4');
});

test('switchboard: portable SMIL wire flow matches Rust baked instants', async ({ page }) => {
  await page.goto(url + '#switchboard');
  const errors = await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/switchboard.ts');
    const host = document.createElement('div'); document.body.append(host); const errors = [];
    for (const wire of ['straight', 'elbow', 'curve']) for (const motion of ['none', 'flow']) for (const timeSeconds of [0, 0.3, 1.75, 4]) {
      const frame = await adapter.evaluate({ design: { toolId: adapter.id, params: { ...adapter.defaults, wire, motion, st: Array(35).fill(1) }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds });
      const offsets = () => [...host.querySelectorAll('[stroke-dasharray]')].map(el => parseFloat(getComputedStyle(el).strokeDashoffset));
      host.innerHTML = frame.scene.motionSvg; const svg = host.querySelector('svg')!; svg.pauseAnimations(); svg.setCurrentTime(timeSeconds);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const animated = offsets(); host.innerHTML = frame.scene.svg; const baked = offsets();
      if (!animated.length || animated.some((n, i) => Math.abs(n - baked[i]) > 0.01)) errors.push({ wire, motion, timeSeconds, animated, baked });
    }
    host.remove(); return errors;
  });
  expect(errors).toEqual([]);
});

test('switchboard: unavailable Wasm never falls back to prototype JS', async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort()); await page.goto(url + '#switchboard');
  await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i);
  await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
});
