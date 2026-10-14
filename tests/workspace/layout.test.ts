import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

let dev: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  dev = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await dev.listen();
  url = dev.resolvedUrls!.local[0];
});
test.afterAll(async () => { await dev?.close(); });

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 900, height: 650 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]) {
  test(`integrated workspace fits ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(url);
    await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
    const stage = page.getByRole('region', { name: 'Pan preview with Space and drag' });
    const artwork = page.getByTestId('scene');
    await expect.poll(async () => {
      const outer = (await stage.boundingBox())!;
      const inner = (await artwork.boundingBox())!;
      return Math.abs(inner.x + inner.width / 2 - outer.x - outer.width / 2)
        + Math.abs(inner.y + inner.height / 2 - outer.y - outer.height / 2);
    }).toBeLessThan(2);
    const bounds = (await stage.boundingBox())!;
    const scene = (await artwork.boundingBox())!;
    expect(scene.width).toBeLessThanOrEqual(bounds.width - 47);
    expect(scene.height).toBeLessThanOrEqual(bounds.height - 47);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);

    const inspector = page.getByRole('complementary', { name: 'Design controls' });
    const scroll = inspector.locator('.inspector-scroll');
    const exportButton = page.getByRole('button', { name: 'Export artwork', exact: true });
    const before = (await exportButton.boundingBox())!;
    await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect((await exportButton.boundingBox())!.y).toBe(before.y);
    const scrollBounds = (await scroll.boundingBox())!;
    expect(scrollBounds.y + scrollBounds.height).toBeLessThanOrEqual(before.y);
    if (viewport.width > 640) {
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height);
      await expect(exportButton).toBeInViewport();
    } else {
      const panelBounds = (await inspector.boundingBox())!;
      expect(panelBounds.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
      await exportButton.scrollIntoViewIfNeeded();
      await expect(exportButton).toBeInViewport();
    }
  });
}

test('numeric resets stay in their binding row and remain keyboard accessible', async ({ page }) => {
  await page.goto(url);
  const seed = page.getByRole('spinbutton', { name: 'Seed exact', exact: true });
  await seed.fill('84');
  await seed.press('Tab');
  const reset = page.getByRole('button', { name: 'Reset Seed', exact: true });
  const row = page.locator('.parameter-number').filter({ has: seed });
  await expect(row.getByRole('button', { name: 'Reset Seed', exact: true })).toHaveCount(1);
  await expect(page.locator('.tp-btnv')).toHaveCount(0);
  const inputBounds = (await seed.boundingBox())!;
  const resetBounds = (await reset.boundingBox())!;
  expect(Math.abs(inputBounds.y - resetBounds.y)).toBeLessThan(1);
  await reset.focus();
  await expect(reset).toHaveCSS('opacity', '1');
  await reset.press('Enter');
  await expect(seed).toHaveValue('42');
  await expect(reset).toBeFocused();
});

test('native panels share the parameter theme and stay usable when expanded', async ({ page }) => {
  await page.goto(url);
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  const width = page.getByRole('spinbutton', { name: 'Width', exact: true });
  const seed = page.getByRole('spinbutton', { name: 'Seed exact', exact: true });
  expect(await width.evaluate(element => getComputedStyle(element).backgroundColor))
    .toBe(await seed.evaluate(element => getComputedStyle(element).backgroundColor));
  await width.fill('720');
  await width.press('Tab');
  await expect(page.getByTestId('scene').locator('svg')).toHaveAttribute('width', '720');
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByLabel('Snapshot name', { exact: true }).fill('A quiet workspace');
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load A quiet workspace', exact: true })).toBeVisible();
  await page.locator('summary').filter({ hasText: /^Typefaces$/ }).click();
  await expect(page.getByLabel('Primary typeface', { exact: true })).toBeHidden();
  await page.locator('summary').filter({ hasText: /^Typefaces$/ }).click();
  await expect(page.getByLabel('Primary typeface', { exact: true })).toBeVisible();
});
