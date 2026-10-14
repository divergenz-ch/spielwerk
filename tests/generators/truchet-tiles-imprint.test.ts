import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });

test('Truchet: styles, strands, inks, fixed draws, seed, dimensions and deterministic Rust fixtures', async ({ page }) => {
  await page.goto(url + '#truchet-tiles');
  const result = await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/truchet-tiles.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, lines: 3, duo: 50 }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 600, height: 800 } }, assets: [] }, timeSeconds: 0 };
    const first = await adapter.evaluate(input), same = await adapter.evaluate(input);
    const styles = [];
    for (const style of ['arcs', 'triangles', '10 PRINT', 'mix']) { input.design.params.style = style; styles.push((await adapter.evaluate(input)).scene); }
    input.design.artboard.dimensions = { width: 800, height: 600 }; const wide = await adapter.evaluate(input);
    const rejected = [];
    for (const [width, height, timeSeconds] of [[99, 600, 0], [8001, 600, 0], [600, 99, 0], [600, 8001, 0], [600, 600, -1]]) {
      try { await adapter.evaluate({ ...input, design: { ...input.design, artboard: { mode: 'fixed', dimensions: { width, height } } }, timeSeconds }); rejected.push(false); } catch { rejected.push(true); }
    }
    input.design.seed = 43; const seeded = await adapter.evaluate(input);
    return { first, same, styles, wide, seeded, rejected, capabilities: adapter.capabilities };
  });
  expect(result.first).toEqual(result.same);
  expect(result.first.scene.svg.match(/ A/g)!.length).toBe(result.first.scene.tiles.length * 6);
  expect(new Set(result.first.scene.tiles.map(t => t.ink)).size).toBe(2);
  for (const [i, style] of ['arcs', 'triangles', '10 PRINT'].entries()) expect(result.styles[i].tiles.every(t => t.style === style)).toBe(true);
  expect(new Set(result.styles[3].tiles.map(t => t.style)).size).toBe(3);
  expect(result.styles[0].tiles.map(t => [t.turn, t.ink])).toEqual(result.styles[2].tiles.map(t => [t.turn, t.ink]));
  expect(result.wide.scene.rows).not.toBe(result.first.scene.rows);
  expect(result.wide.scene.tiles).not.toEqual(result.seeded.scene.tiles);
  expect(result.rejected).toEqual(Array(5).fill(true)); expect(result.capabilities.formats).toEqual(['svg', 'png']);
});

test('Imprint: relief, light, shadow, halo, all motion modes, responsive layout and relative migration', async ({ page }) => {
  await page.goto(url + '#imprint');
  const result = await page.evaluate(async () => {
    const { adapter, imprint } = await import('/src/tools/imprint.ts');
    const legacy = { wpx: 600, hpx: 800, stroke: 12, depth: 8, soften: 6, rays: 14, seed: 42 };
    const migrated = imprint.prepareSettings!(legacy);
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, ...migrated, motion: 'none', pairs: 100 }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 600, height: 800 } }, assets: [] }, timeSeconds: 0 };
    const first = await adapter.evaluate(input), same = await adapter.evaluate(input);
    const changes = [];
    for (const [key, value] of Object.entries({ relief: 'pressed', light: 90, shadowO: 0, glowO: 0, halo: 0 })) changes.push((await adapter.evaluate({ ...input, design: { ...input.design, params: { ...input.design.params, [key]: value } } })).scene.svg);
    const motions = [];
    for (const motion of ['none', 'drift', 'grow in', 'grow loop']) {
      const design = { ...input.design, params: { ...input.design.params, motion } };
      motions.push([await adapter.evaluate({ design, timeSeconds: 0 }), await adapter.evaluate({ design, timeSeconds: 2 })]);
    }
    const doubled = await adapter.evaluate({ ...input, design: { ...input.design, artboard: { mode: 'responsive', dimensions: { width: 1200, height: 1600 } } } });
    const wide = await adapter.evaluate({ ...input, design: { ...input.design, artboard: { mode: 'responsive', dimensions: { width: 800, height: 600 } } } });
    return { first, same, changes, motions, doubled, wide, migrated, twice: imprint.prepareSettings!(migrated), capabilities: adapter.capabilities };
  });
  expect(result.first).toEqual(result.same); expect(result.first.scene.rays).toHaveLength(28);
  for (const changed of result.changes) expect(changed).not.toBe(result.first.scene.svg);
  expect(result.motions[0][0].scene.svg).toBe(result.motions[0][1].scene.svg);
  for (const pair of result.motions.slice(1)) { expect(pair[0].scene.rays).not.toEqual(pair[1].scene.rays); expect(pair[0].scene.motionSvg).toContain('<animate'); }
  expect(result.motions[2][1].scene.rays.some(r => r.progress > 0 && r.progress < 1)).toBe(true);
  expect(result.migrated).toEqual(result.twice); expect(result.migrated).toMatchObject({ rel: 1, stroke: 2, depth: 8 / 600 * 100, soften: 1 });
  expect(result.doubled.scene.rays[0].width).toBeCloseTo(result.first.scene.rays[0].width * 2);
  expect(result.wide.scene.rays[0].start).not.toEqual(result.first.scene.rays[0].start);
  expect(result.capabilities.formats).toEqual(['svg', 'png']);
});

for (const id of ['truchet-tiles', 'imprint']) test(`${id}: registered workspace, responsive SVG/PNG, playback and snapshot persistence`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'assert') errors.push(msg.text()); });
  await page.goto(url + '#' + id);
  const scene = page.getByTestId('scene'); await expect(scene.locator('svg').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('responsive');
  for (const [label, value] of [['Container width', '400'], ['Container height', '300']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
  await expect(scene.locator('svg').first()).toHaveAttribute('viewBox', '0 0 400 300');
  expect(await page.getByRole('combobox', { name: 'Output format' }).locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))).toEqual(['svg', 'png']);
  if (id === 'imprint') {
    await page.getByRole('button', { name: 'Play motion', exact: true }).click(); const first = await scene.innerHTML(); await expect.poll(() => scene.innerHTML()).not.toBe(first); await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  } else await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toHaveCount(0);
  for (const format of ['svg', 'png']) {
    await page.getByRole('combobox', { name: 'Output format' }).selectOption(format);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
    const download = await pending, bytes = await readFile((await download.path())!);
    expect(download.suggestedFilename()).toBe(`${id}.${format}`);
    if (format === 'svg') { expect(bytes.toString()).toContain('viewBox="0 0 400 300"'); expect(bytes.toString()).not.toMatch(/script|onpointer/); if (id === 'imprint') expect(bytes.toString()).toContain('<animate'); }
    else {
      const decoded = await page.evaluate(async bytes => {
        const image = await createImageBitmap(new Blob([Uint8Array.from(bytes)], { type: 'image/png' }));
        const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height }); const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, image.width, image.height).data; const colors = new Set(); for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]},${pixels[i+3]}`);
        return { width: image.width, height: image.height, colors: colors.size };
      }, [...bytes]);
      expect(decoded).toMatchObject({ width: 400, height: 300 }); expect(decoded.colors).toBeGreaterThan(2);
    }
  }
  await page.screenshot({ path: `.flow/tmp/${id}-preview.png`, fullPage: true });
  if (id === 'imprint') {
    const legacy = { wpx: 600, hpx: 800, stroke: 12, depth: 8, soften: 6, seed: 42 };
    await page.evaluate(legacy => localStorage.setItem('imprint', JSON.stringify(legacy)), legacy);
    await page.reload();
    await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('2');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('imprint')!).rel)).toBe(1);
    await page.getByLabel('Import snapshots', { exact: true }).setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ tool: id, snaps: [{ name: 'legacy relief', at: 1, params: legacy, font: null, accent: null }] })) });
    await page.getByRole('button', { name: 'Load legacy relief', exact: true }).click();
    await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('2');
    await page.getByRole('button', { name: 'Load legacy relief', exact: true }).click();
    await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('2');
    await page.reload(); await expect(page.getByLabel('Stroke % of artboard width exact', { exact: true })).toHaveValue('2');
  }
  expect(errors).toEqual([]);
});

test('Imprint: portable SVG motion matches baked Rust tip positions and growth', async ({ page }) => {
  await page.goto(url + '#imprint');
  const failures = await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/imprint.ts'); const host = document.createElement('div'); document.body.append(host); const failures = [];
    for (const motion of ['none', 'drift', 'grow in', 'grow loop']) for (const timeSeconds of [0, 0.3, 2, 8]) {
      const frame = await adapter.evaluate({ design: { toolId: adapter.id, params: { ...adapter.defaults, motion }, seed: 42, artboard: { mode: 'fixed', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds });
      host.innerHTML = frame.scene.motionSvg; const svg = host.querySelector('svg')!; svg.pauseAnimations(); svg.setCurrentTime(timeSeconds); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const animated = [...host.querySelectorAll('g[filter="url(#emb)"] line')].map(el => { const l = el as SVGLineElement; const tip = new DOMPoint(l.x2.animVal.value, l.y2.animVal.value).matrixTransform(l.getCTM()!); return [tip.x, tip.y, parseFloat(getComputedStyle(l).strokeDashoffset)]; });
      host.innerHTML = frame.scene.svg;
      const baked = [...host.querySelectorAll('g[filter="url(#emb)"] line')].map(el => { const l = el as SVGLineElement; const tip = new DOMPoint(l.x2.baseVal.value, l.y2.baseVal.value).matrixTransform(l.getCTM()!); return [tip.x, tip.y, parseFloat(getComputedStyle(l).strokeDashoffset)]; });
      if (!animated.length || animated.some((v, i) => v.some((n, j) => Math.abs(n - baked[i][j]) > 0.05))) failures.push({ motion, timeSeconds, animated: animated[0], baked: baked[0] });
    }
    host.remove(); return failures;
  });
  expect(failures).toEqual([]);
});

for (const id of ['truchet-tiles', 'imprint']) test(`${id}: unavailable Wasm shows the shared failure rather than JS artwork`, async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort()); await page.goto(url + '#' + id);
  await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i); await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
});
