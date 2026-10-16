import { test, expect, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { rasterFile } from './image-fixture';

let server: ViteDevServer, url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('liquid-gradients', JSON.stringify({ wpx: 256, hpx: 192 })));
  await page.goto(url + '#liquid-gradients');
  await expect(page.getByTestId('scene').locator('canvas')).toBeVisible();
  await expect(page.getByLabel('Upload image', { exact: true })).toBeEnabled();
});
const canvas = (page: Page) => page.getByTestId('scene').locator('canvas');
const pixels = (page: Page) => canvas(page).evaluate((node: HTMLCanvasElement) => node.toDataURL());
async function upload(page: Page, type = 'image/png') {
  const file = await rasterFile(page, type);
  await page.getByLabel('Upload image', { exact: true }).setInputFiles(file);
  await expect(page.getByText(file.name, { exact: true })).toBeVisible();
  await expect(canvas(page)).toHaveAttribute('aria-label', 'Liquid image artwork');
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  return file;
}

test('GPU image orientation, alpha, fitting, mix, loop seam and texture reuse', async ({ page }) => {
  const file = await rasterFile(page);
  const result = await page.evaluate(async bytes => {
    const { adapter } = await import('/src/tools/liquid-gradients.ts');
    const { liquidRenderer } = await import('/src/tools/liquid-renderer.ts');
    const asset = { id: 'image', role: 'image', mediaType: 'image/png', bytes: new Uint8Array(bytes) };
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, grain: 0, distortion: 0 }, seed: 42, assets: [asset], artboard: { mode: 'fixed', dimensions: { width: 64, height: 32 } } }, timeSeconds: 0 };
    const target = document.createElement('div');
    const draw = async (request = input) => {
      const frame = await adapter.evaluate(request);
      liquidRenderer.render(frame, target);
      const canvas = target.querySelector('canvas')!;
      const gl = canvas.getContext('webgl2')!;
      const sample = (x: number, y: number) => {
        const pixel = new Uint8Array(4); gl.readPixels(x, canvas.height - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        return [...pixel];
      };
      return { frame, image: canvas.toDataURL(), corners: [sample(2, 2), sample(61, 2), sample(2, 29), sample(61, 29)], center: sample(32, 16), top: sample(20, 2) };
    };
    try {
      const original = await draw();
      const gl = target.querySelector('canvas')!.getContext('webgl2')!;
      const texImage = gl.texImage2D.bind(gl);
      let uploads = 0;
      gl.texImage2D = (...args) => { uploads++; texImage(...args); };
      const repeated = await draw();
      const moving = { ...input, design: { ...input.design, params: { ...input.design.params, distortion: 1.5 } } };
      const first = await draw(moving), later = await draw({ ...moving, timeSeconds: 3 });
      const seam = await draw({ ...moving, timeSeconds: first.frame.durationSeconds });
      const repeatedUploads = uploads;
      const gradient = await draw({ ...input, design: { ...input.design, assets: [] } });
      const noMix = await draw({ ...input, design: { ...input.design, params: { ...input.design.params, imageMix: 0 } } });
      const halfMix = await draw({ ...input, design: { ...input.design, params: { ...input.design.params, imageMix: 50 } } });
      const square = { ...input, design: { ...input.design, artboard: { mode: 'fixed', dimensions: { width: 64, height: 64 } } } };
      const cover = await draw(square);
      const contain = await draw({ ...square, design: { ...square.design, params: { ...square.design.params, imageFit: 'contain' } } });
      const squareGradient = await draw({ ...square, design: { ...square.design, assets: [] } });
      return {
        corners: original.corners, alpha: original.center.join() === gradient.center.join(),
        deterministic: original.image === repeated.image, decodeCached: original.frame.scene.image === repeated.frame.scene.image,
        moves: first.image !== later.image, seam: first.image === seam.image, repeatedUploads,
        noMix: noMix.image === gradient.image, blended: halfMix.image !== gradient.image && halfMix.image !== original.image,
        coverTop: cover.top, containTop: contain.top, gradientTop: squareGradient.top, gpuError: gl.getError(),
      };
    } finally { liquidRenderer.dispose(target); }
  }, [...file.buffer]);
  expect(result.corners).toEqual([[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255]]);
  expect(result).toMatchObject({ alpha: true, deterministic: true, decodeCached: true, moves: true, seam: true, repeatedUploads: 0, noMix: true, blended: true, gpuError: 0 });
  expect(result.coverTop).toEqual([255, 0, 0, 255]);
  expect(result.containTop).toEqual(result.gradientTop);
});

test('upload, remove, reload and old/new snapshot JSON preserve or clear the image', async ({ page }) => {
  const gradient = await pixels(page);
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByLabel('Snapshot name').fill('Gradient only');
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load Gradient only', exact: true })).toBeVisible();
  const file = await upload(page);
  const withImage = await pixels(page);
  expect(withImage).not.toBe(gradient);
  await page.getByLabel('Snapshot name').fill('With image');
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load With image', exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export snapshots', exact: true }).click();
  const snapshotJSON = JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
  expect(snapshotJSON.snaps[1].image.dataURL).toBe('data:image/png;base64,' + file.buffer.toString('base64'));
  expect(snapshotJSON.snaps[0].image).toBeUndefined();
  await page.getByRole('button', { name: 'Remove image', exact: true }).click();
  await expect.poll(() => pixels(page)).toBe(gradient);
  await page.getByRole('button', { name: 'Load With image', exact: true }).click();
  await expect.poll(() => pixels(page)).toBe(withImage);
  await page.reload();
  await expect(page.getByText(file.name, { exact: true })).toBeVisible();
  await expect.poll(() => pixels(page)).toBe(withImage);
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByRole('button', { name: 'Load Gradient only', exact: true }).click();
  await expect.poll(() => pixels(page)).toBe(gradient);
  await expect(page.getByRole('button', { name: 'Remove image', exact: true })).toHaveCount(0);
  snapshotJSON.snaps[1].name = 'Imported image';
  await page.getByLabel('Import snapshots').setInputFiles({ name: 'images.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(snapshotJSON)) });
  await page.getByRole('button', { name: 'Load Imported image', exact: true }).click();
  await expect.poll(() => pixels(page)).toBe(withImage);
  await page.getByRole('button', { name: 'Remove image', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove image', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Upload image')).toBeEnabled();
  await expect.poll(() => pixels(page)).toBe(gradient);
});

for (const type of ['image/jpeg', 'image/webp']) test(`${type} is decoded and retained as original bytes`, async ({ page }) => {
  const file = await upload(page, type);
  const stored = await page.evaluate(async () => {
    const { images } = await import('/src/workspace/images.ts');
    const { browserPersistence } = await import('/src/workspace/storage.ts');
    return images('liquid-gradients', browserPersistence()).load();
  });
  expect(stored?.dataURL).toBe(`data:${type};base64,${file.buffer.toString('base64')}`);
});

test('invalid, oversized, and corrupt images fail without replacing the current image', async ({ page }) => {
  const file = await upload(page);
  const before = await pixels(page);
  const oversized = await rasterFile(page, 'image/png', 4097, 1);
  for (const candidate of [
    { name: 'not.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
    { name: 'vector.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>') },
    { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) },
    { name: 'corrupt.png', mimeType: 'image/png', buffer: file.buffer.subarray(0, 16) }, oversized,
  ]) {
    await page.getByLabel('Upload image').setInputFiles(candidate);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Upload image')).toBeEnabled();
    expect(await pixels(page)).toBe(before);
    await expect(page.getByText(file.name, { exact: true })).toBeVisible();
  }
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  const invalid = { tool: 'liquid-gradients', snaps: [{ name: 'remote', at: 1, params: {}, font: null, image: { file: 'remote', dataURL: 'https://example.com/image.png' } }] };
  await page.getByLabel('Import snapshots').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
  await expect(page.getByRole('alert')).toContainText('PNG, JPEG, or WebP');
  await expect(page.getByRole('button', { name: 'Load remote', exact: true })).toHaveCount(0);
  expect(await pixels(page)).toBe(before);
});

test('image export captures immutable bytes and settings at activation', async ({ page }) => {
  await upload(page);
  const result = await page.evaluate(async () => {
    const { adapter, artwork } = await import('/src/tools/liquid-gradients.ts');
    const { exportArtwork } = await import('/src/workspace/exports.ts');
    const { images, imageAsset } = await import('/src/workspace/images.ts');
    const { browserPersistence } = await import('/src/workspace/storage.ts');
    const asset = imageAsset((await images(adapter.id, browserPersistence()).load())!);
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults }, seed: 73, assets: [asset], artboard: { mode: 'fixed', dimensions: { width: 256, height: 192 } } }, timeSeconds: 5 };
    const expected = await exportArtwork(adapter, artwork, 'png', input, () => {});
    const pending = exportArtwork(adapter, artwork, 'png', input, () => {});
    asset.bytes.fill(0); input.design.params.imageMix = 0; input.timeSeconds = 0;
    const actual = await pending;
    const a = new Uint8Array(await expected.blob.arrayBuffer()), b = new Uint8Array(await actual.blob.arrayBuffer());
    return a.length === b.length && a.every((value, i) => value === b[i]);
  });
  expect(result).toBe(true);
});

test('image PNG export is independent, matches preview pixels and survives context restoration', async ({ page }) => {
  await upload(page);
  const expected = await pixels(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  const file = await pending;
  const bytes = await readFile((await file.path())!);
  const difference = await page.evaluate(async ([left, right]) => {
    const decode = async (url: string) => {
      const bitmap = await createImageBitmap(await (await fetch(url)).blob());
      const canvas = Object.assign(document.createElement('canvas'), { width: bitmap.width, height: bitmap.height });
      const context = canvas.getContext('2d')!; context.drawImage(bitmap, 0, 0); bitmap.close();
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const [a, b] = await Promise.all([decode(left), decode(right)]);
    return a.reduce((max, value, index) => Math.max(max, Math.abs(value - b[index])), 0);
  }, [expected, `data:image/png;base64,${bytes.toString('base64')}`]);
  expect(difference).toBe(0);
  await page.evaluate(async () => {
    const canvas = document.querySelector('[data-testid="scene"] canvas') as HTMLCanvasElement;
    (window as any).imageCanvas = canvas;
    const extension = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
    await new Promise<void>(ok => { canvas.addEventListener('webglcontextlost', () => ok(), { once: true }); extension.loseContext(); });
    setTimeout(() => extension.restoreContext(), 50);
  });
  await expect.poll(() => pixels(page)).toBe(expected);
  await page.evaluate(() => {
    const gl = (window as any).imageCanvas.getContext('webgl2');
    const original = gl.texImage2D.bind(gl);
    (window as any).imageUploads = 0;
    gl.texImage2D = (...args) => { (window as any).imageUploads++; original(...args); };
  });
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect.poll(() => pixels(page)).not.toBe(expected);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).imageUploads)).toBe(0);
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('truchet-tiles');
  await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
  await expect(page.getByLabel('Upload image')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).imageCanvas.getContext('webgl2').isContextLost())).toBe(true);
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('liquid-gradients');
  await expect.poll(() => pixels(page)).toBe(expected);
});
