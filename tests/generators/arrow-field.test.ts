import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });

test('arrow-field: real Wasm arrangements, seed, rotation, time, pointer and limits', async ({ page }) => {
  await page.goto(url + '#arrow-field');
  const result = await page.evaluate(async () => {
    const { adapter, arrowField } = await import('/src/tools/arrow-field.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, motion: 'wave' }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds: 0.25 };
    const first = await adapter.evaluate(input);
    const repeat = await adapter.evaluate(input);
    input.design.seed = 99; const seeded = await adapter.evaluate(input); input.design.seed = 42;
    input.timeSeconds = 1; const later = await adapter.evaluate(input); input.timeSeconds = 0.25;
    const arrangements = [];
    for (const field of ['noise', 'swirl', 'radial', 'grid']) { input.design.params.field = field; arrangements.push((await adapter.evaluate(input)).scene.cells.map(c => c.angle)); }
    input.design.params.field = 'grid'; input.design.params.motion = 'none';
    const plain = await adapter.evaluate(input);
    const attracted = await arrowField.preview!(input, { x: 200, y: 100 });
    input.design.params.pull = -100;
    const repelled = await arrowField.preview!(input, { x: 200, y: 100 });
    const portable = await adapter.evaluate(input);
    input.design.artboard.dimensions.height = 500; const tall = await adapter.evaluate(input);
    const invalid = [];
    for (const width of [99, 8001]) { input.design.artboard.dimensions.width = width; try { await adapter.evaluate(input); } catch (e) { invalid.push(String(e)); } }
    input.design.artboard.dimensions.width = 400; input.timeSeconds = -1;
    try { await adapter.evaluate(input); } catch (e) { invalid.push(String(e)); }
    return { same: JSON.stringify(first) === JSON.stringify(repeat), seeded: first.scene.svg !== seeded.scene.svg, later: first.scene.svg !== later.scene.svg, arrangements, plain, attracted, repelled, portable, tall, invalid };
  });
  expect(result.same).toBe(true); expect(result.seeded).toBe(true); expect(result.later).toBe(true);
  expect(new Set(result.arrangements.map(a => JSON.stringify(a))).size).toBe(4);
  expect(result.attracted.scene.svg).not.toBe(result.plain.scene.svg); expect(result.repelled.scene.svg).not.toBe(result.attracted.scene.svg);
  expect(result.portable.scene.svg).toBe(result.plain.scene.svg);
  expect(result.tall.scene.cells.length).toBeGreaterThan(result.plain.scene.cells.length);
  expect(result.tall.scene.cells[0].x).toBe(result.plain.scene.cells[0].x);
  expect(result.invalid).toHaveLength(3); result.invalid.forEach(message => expect(message).toContain('dimensions or time'));
});

test('arrow-field: exported SMIL rotation agrees with evaluated instants', async ({ page }) => {
  await page.goto(url + '#arrow-field');
  const errors = await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/arrow-field.ts');
    const host = document.createElement('div'); document.body.append(host);
    const errors = [];
    for (const motion of ['none', 'wave', 'spin', 'random']) for (const timeSeconds of [0, 0.5, 3.25, 8]) {
      const frame = await adapter.evaluate({ design: { toolId: adapter.id, params: { ...adapter.defaults, motion }, seed: 42, artboard: { mode: 'fixed', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds });
      const matrices = () => [...host.querySelectorAll('[data-arrow] path')].map(path => { const m = (path as SVGGraphicsElement).getCTM()!; return [m.a, m.b, m.c, m.d, m.e, m.f]; });
      host.innerHTML = frame.scene.motionSvg; const svg = host.querySelector('svg')!; svg.pauseAnimations(); svg.setCurrentTime(timeSeconds);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const animated = matrices(); host.innerHTML = frame.scene.svg; const baked = matrices();
      const delta = Math.max(...animated.flatMap((m, i) => m.map((n, j) => Math.abs(n - baked[i][j]))));
      if (delta > 0.1) errors.push({ motion, timeSeconds, delta });
    }
    host.remove(); return errors;
  });
  expect(errors).toEqual([]);
});

test('arrow-field: workspace pointer is transient; responsive SVG PNG GIF artwork', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(url + '#arrow-field');
  const scene = page.getByTestId('scene');
  await expect(scene.locator('[data-arrow]').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('none');
  await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('responsive');
  for (const [label, value] of [['Container width', '400'], ['Container height', '300']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
  await expect(scene.locator('svg')).toHaveAttribute('viewBox', '0 0 400 300');
  const stored = await page.evaluate(() => localStorage.getItem('arrow-field'));
  await page.mouse.move(1, 1); const plain = await scene.innerHTML();
  const rect = (await scene.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 3);
  await expect.poll(() => scene.innerHTML()).not.toBe(plain);
  const attracted = await scene.innerHTML();
  await page.getByLabel('Pointer pull % exact', { exact: true }).fill('-100'); await page.getByLabel('Pointer pull % exact', { exact: true }).press('Tab');
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 3);
  await expect.poll(() => scene.innerHTML()).not.toBe(attracted);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('arrow-field')))!).pointer).toBeUndefined();
  await page.mouse.move(1, 1);
  await page.getByLabel('Pointer pull % exact', { exact: true }).fill('100'); await page.getByLabel('Pointer pull % exact', { exact: true }).press('Tab');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('arrow-field'))).toBe(stored);
  await expect.poll(() => scene.innerHTML()).toBe(plain);
  await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('spin');
  for (const [label, value] of [['Turn seconds exact', '1'], ['GIF fps exact', '5']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  const before = await scene.innerHTML(); await expect.poll(() => scene.innerHTML()).not.toBe(before);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  for (const format of ['svg', 'png', 'gif']) {
    await page.getByRole('combobox', { name: 'Output format' }).selectOption(format);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
    const download = await pending; const bytes = await readFile((await download.path())!);
    expect(download.suggestedFilename()).toBe(`arrow-field.${format}`);
    if (format === 'svg') { expect(bytes.toString()).toContain('<animateTransform'); expect(bytes.toString()).toContain('viewBox="0 0 400 300"'); expect(bytes.toString()).not.toMatch(/pointer|data-arrow|onpointer/); }
    else {
      const decoded = await page.evaluate(async ({ bytes, format }) => {
        const decoder = new (window as any).ImageDecoder({ data: Uint8Array.from(bytes), type: `image/${format}` }); await decoder.tracks.ready;
        const count = decoder.tracks.selectedTrack.frameCount; const first = (await decoder.decode({ frameIndex: 0 })).image;
        const canvas = Object.assign(document.createElement('canvas'), { width: first.displayWidth, height: first.displayHeight }); const ctx = canvas.getContext('2d')!; ctx.drawImage(first, 0, 0); const a = [...ctx.getImageData(0, 0, canvas.width, canvas.height).data]; first.close();
        let different = false; if (count > 1) { const last = (await decoder.decode({ frameIndex: count - 1 })).image; ctx.drawImage(last, 0, 0); different = a.some((v, i) => v !== ctx.getImageData(0, 0, canvas.width, canvas.height).data[i]); last.close(); }
        decoder.close(); return { count, width: canvas.width, height: canvas.height, different, colors: new Set(a).size };
      }, { bytes: [...bytes], format });
      expect(decoded.width).toBe(400); expect(decoded.height).toBe(300); expect(decoded.colors).toBeGreaterThan(2); expect(decoded.count).toBe(format === 'gif' ? 5 : 1); if (format === 'gif') expect(decoded.different).toBe(true);
    }
  }
});

test('arrow-field: no JavaScript fallback when Wasm fails', async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort()); await page.goto(url + '#arrow-field');
  await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i);
  await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
});
