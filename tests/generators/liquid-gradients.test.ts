import { test, expect, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';

let server: ViteDevServer, url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });
// These pixel/snapshot contracts use a still initial frame; autoplay has its own suite.
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });
const canvas = (page: Page) => page.getByTestId('scene').locator('canvas');
const image = (page: Page) => canvas(page).evaluate((node: HTMLCanvasElement) => node.toDataURL());
async function edit(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel(label, { exact: true }).press('Tab');
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
}

test('real Wasm uniforms and GPU pixels: repeat, seed, controls, loop seam, static and resizing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '#liquid-gradients');
  await expect(canvas(page)).toBeVisible();
  const result = await page.evaluate(async () => {
    const { adapter } = await import('/src/tools/liquid-gradients.ts');
    const { liquidRenderer: renderer } = await import('/src/tools/liquid-renderer.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults }, seed: 42, assets: [], artboard: { mode: 'fixed', dimensions: { width: 256, height: 192 } } }, timeSeconds: 0 };
    const target = document.createElement('div');
    const draw = async (request = input) => {
      const frame = await adapter.evaluate(request); renderer.render(frame, target);
      return { frame, pixels: target.querySelector('canvas')!.toDataURL() };
    };
    try {
      const first = await draw(), repeat = await draw();
      const originalCanvas = target.querySelector('canvas');
      const gl = originalCanvas!.getContext('webgl2')!;
      const pixels = new Uint8Array(256 * 192 * 4); gl.readPixels(0, 0, 256, 192, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const later = await draw({ ...input, timeSeconds: 3 });
      const loop = await draw({ ...input, timeSeconds: first.frame.durationSeconds });
      const seed = await draw({ ...input, design: { ...input.design, seed: 99 } });
      const changes = [];
      for (const patch of [{ scale: 2 }, { distortion: 0 }, { softness: 0.1 }, { grain: 15 }, { c1: '#00ff00' }]) {
        changes.push((await draw({ ...input, design: { ...input.design, params: { ...input.design.params, ...patch } } })).pixels !== first.pixels);
      }
      const still = { ...input, design: { ...input.design, params: { ...input.design.params, motion: 'none' } } };
      const staticA = await draw(still), staticB = await draw({ ...still, timeSeconds: 8 });
      const wide = await draw({ ...input, design: { ...input.design, artboard: { mode: 'responsive', dimensions: { width: 400, height: 192 } } } });
      const invalid = [];
      for (const width of [0, 4097]) {
        try { await adapter.evaluate({ ...input, design: { ...input.design, artboard: { mode: 'fixed', dimensions: { width, height: 192 } } } }); invalid.push(false); }
        catch { invalid.push(true); }
      }
      return { repeat: JSON.stringify(first) === JSON.stringify(repeat), seam: first.pixels === loop.pixels,
        moves: later.pixels !== first.pixels, seeded: seed.pixels !== first.pixels, changes,
        still: staticA.pixels === staticB.pixels && staticB.frame.durationSeconds === 0,
        reused: originalCanvas === target.querySelector('canvas'), wide: wide.frame.dimensions,
        colors: new Set(pixels).size, opaque: pixels.every((v, i) => i % 4 !== 3 || v === 255),
        gpuError: gl.getError(), invalid,
      };
    } finally { renderer.dispose(target); }
  });
  expect(result).toMatchObject({ repeat: true, seam: true, moves: true, seeded: true, still: true, reused: true, opaque: true, gpuError: 0 });
  expect(result.colors).toBeGreaterThan(100);
  expect(result.changes).toEqual([true, true, true, true, true]);
  expect(result.invalid).toEqual([true, true]);
  expect(result.wide).toEqual({ width: 400, height: 192 });
  expect(errors).toEqual([]);
});

test('workspace controls, snapshot restore, playback, resize, persistence and GPU teardown', async ({ page }) => {
  await page.goto(url + '#liquid-gradients');
  await expect(canvas(page)).toBeVisible();
  await expect(page.getByLabel('Primary typeface', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Output format').locator('option')).toHaveText(['PNG', 'Website embed (ZIP)']);
  await page.evaluate(() => { (window as any).originalCanvas = document.querySelector('[data-testid="scene"] canvas'); });
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  await edit(page, 'Width', '320'); await edit(page, 'Height', '240');
  await expect(canvas(page)).toHaveAttribute('width', '320');
  await expect(canvas(page)).toHaveAttribute('height', '240');
  const first = await image(page);
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByLabel('Snapshot name').fill('Soft flow');
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load Soft flow', exact: true })).toBeVisible();
  await edit(page, 'Seed exact', '93');
  expect(await image(page)).not.toBe(first);
  await page.getByRole('button', { name: 'Load Soft flow', exact: true }).click();
  await expect(page.getByLabel('Seed exact', { exact: true })).toHaveValue('42');
  await expect.poll(() => image(page)).toBe(first);
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect.poll(() => image(page)).not.toBe(first);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  const paused = await image(page); await page.waitForTimeout(120);
  expect(await image(page)).toBe(paused);
  expect(await page.evaluate(() => (window as any).originalCanvas === document.querySelector('[data-testid="scene"] canvas'))).toBe(true);
  await page.getByLabel('Layout', { exact: true }).selectOption('responsive');
  await edit(page, 'Container width', '480');
  await expect(canvas(page)).toHaveAttribute('width', '480');
  const gl = await page.evaluateHandle(() => (window as any).originalCanvas.getContext('webgl2'));
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('arrow-maze');
  await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
  expect(await gl.evaluate(context => context.isContextLost())).toBe(true);
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('liquid-gradients');
  await expect(canvas(page)).toHaveAttribute('width', '480');
  await expect(page.getByLabel('Seed exact', { exact: true })).toHaveValue('42');
});

test('PNG captures selected time and dimensions with the same GPU pixels, independently of preview', async ({ page }) => {
  await page.goto(url + '#liquid-gradients'); await expect(canvas(page)).toBeVisible();
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  await edit(page, 'Width', '320'); await edit(page, 'Height', '240');
  const expected = await image(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('liquid-gradients-42.png');
  const bytes = await readFile((await file.path())!);
  expect(bytes.readUInt32BE(16)).toBe(320); expect(bytes.readUInt32BE(20)).toBe(240);
  const delta = await page.evaluate(async ([a, b]) => {
    const pixels = async (url: string) => {
      const bitmap = await createImageBitmap(await (await fetch(url)).blob());
      const canvas = Object.assign(document.createElement('canvas'), { width: bitmap.width, height: bitmap.height });
      const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0); bitmap.close();
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const [left, right] = await Promise.all([pixels(a), pixels(b)]);
    return left.reduce((max, value, i) => Math.max(max, Math.abs(value - right[i])), 0);
  }, [expected, `data:image/png;base64,${bytes.toString('base64')}`]);
  expect(delta).toBe(0);
  const matches = await page.evaluate(async () => {
    const { adapter, artwork } = await import('/src/tools/liquid-gradients.ts');
    const { exportArtwork } = await import('/src/workspace/exports.ts');
    const { liquidRenderer } = await import('/src/tools/liquid-renderer.ts');
    const input = { design: { toolId: adapter.id, params: adapter.defaults, seed: 71, assets: [], artboard: { mode: 'fixed', dimensions: { width: 240, height: 180 } } }, timeSeconds: 5 };
    const frame = await adapter.evaluate(input), target = document.createElement('div');
    try {
      liquidRenderer.render(frame, target);
      const expectedBlob = await new Promise<Blob>(ok => target.querySelector('canvas')!.toBlob(blob => ok(blob!), 'image/png'));
      const expected = new Uint8Array(await expectedBlob.arrayBuffer());
      const pending = exportArtwork(adapter, artwork, 'png', input, () => {});
      input.timeSeconds = 0; input.design.seed = 42;
      const file = await pending;
      const data = new Uint8Array(await file.blob.arrayBuffer());
      return expected.length === data.length && expected.every((v, i) => v === data[i]) && file.name === 'liquid-gradients-71.png';
    } finally { liquidRenderer.dispose(target); }
  });
  expect(matches).toBe(true);
});

test('context loss restores the selected paused frame without replacing the canvas', async ({ page }) => {
  await page.goto(url + '#liquid-gradients'); await expect(canvas(page)).toBeVisible();
  const before = await image(page);
  await page.evaluate(async () => {
    const canvas = document.querySelector('[data-testid="scene"] canvas') as HTMLCanvasElement;
    const extension = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
    await new Promise<void>(ok => { canvas.addEventListener('webglcontextlost', () => ok(), { once: true }); extension.loseContext(); });
    setTimeout(() => extension.restoreContext(), 50);
  });
  await expect.poll(() => image(page)).toBe(before);
  await page.evaluate(async () => {
    const c = document.querySelector('[data-testid="scene"] canvas') as HTMLCanvasElement;
    const extension = c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
    (window as any).lostContext = extension;
    await new Promise<void>(ok => { c.addEventListener('webglcontextlost', () => ok(), { once: true }); extension.loseContext(); });
  });
  await page.getByLabel('Seed exact', { exact: true }).fill('99');
  await page.getByLabel('Seed exact', { exact: true }).press('Tab');
  await expect(page.getByRole('alert')).toContainText('Graphics context lost');
  await page.evaluate(() => (window as any).lostContext.restoreContext());
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  expect((await image(page)) !== before).toBe(true);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('unsupported WebGL2 reports a clear preview/export failure, not a blank successful frame', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return kind === 'webgl2' ? null : getContext.call(this, kind, ...args); };
  });
  await page.goto(url + '#liquid-gradients');
  await expect(page.getByRole('alert')).toContainText('requires WebGL2');
  await expect(canvas(page)).toHaveCount(0);
  await expect(page.getByTestId('preview-status')).toContainText('Preview failed');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Export failed' })).toContainText('requires WebGL2');
});
