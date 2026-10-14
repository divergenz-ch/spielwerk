import { test, expect, tools, openPackage, seek, state } from './package-fixture';

for (const [index, id] of tools.entries()) test(`${id}: exported visitor surface, mobile host and configuration replacement`, async ({ page, packages }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push(request.url()));
  const origin = packages.origins[index % 2];
  await openPackage(page, origin, id);
  const before = await seek(page, 0.37);
  const pixels = await page.locator('spielwerk-artwork').screenshot();
  await page.mouse.move(120, 120); await page.mouse.down(); await page.mouse.move(240, 180); await page.mouse.up();
  await page.mouse.click(180, 150);
  await page.keyboard.type('VISITOR EDIT');
  expect(await state(page)).toEqual(before);
  expect((await page.locator('spielwerk-artwork').screenshot()).equals(pixels), 'Visitor input must preserve the rendered PNG bytes').toBe(true);
  await expect(page.locator('spielwerk-artwork input, spielwerk-artwork textarea, spielwerk-artwork button, spielwerk-artwork [contenteditable], spielwerk-artwork animate, spielwerk-artwork animateTransform')).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 640 });
  await page.evaluate(() => { const el = document.querySelector('spielwerk-artwork') as HTMLElement; el.style.setProperty('width', '100%', 'important'); el.style.height = '240px'; });
  await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 320 240');
  const mobile = await seek(page, 0.37);
  expect(mobile.dimensions).toEqual({ width: 320, height: 240 });
  expect(mobile.svg).not.toBe(before.svg);
  expect(await seek(page, 0.37)).toEqual(mobile);
  await page.locator('spielwerk-artwork').screenshot({ path: `.flow/tmp/final-host-${id}-mobile.png` });
  await page.setViewportSize({ width: 800, height: 640 });
  await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 800 240');
  const wide = await seek(page, 0.37);
  expect(wide.svg).not.toBe(mobile.svg);
  await page.evaluate(async () => {
    const el = document.querySelector('spielwerk-artwork') as any;
    const config = JSON.parse(el.querySelector('script').textContent);
    config.assets = await Promise.all(config.assets.map(async ({ url, ...asset }: any) => ({ ...asset, bytes: new Uint8Array(await (await fetch(url)).arrayBuffer()) })));
    config.seed = 91; config.params.seed = 91; config.params.paper = '#12ab34';
    await el.setConfig(config); await el.pause(); await el.seek(0.37);
  });
  const replaced = await state(page);
  expect(replaced.dimensions).toEqual(wide.dimensions);
  expect(replaced.svg).not.toBe(wide.svg);
  expect(replaced.svg).toContain('#12ab34');
  expect(requests.every(url => url.startsWith(origin))).toBe(true);
  expect(requests.some(url => url.endsWith('.wasm'))).toBe(true);
  expect(requests.some(url => /\.svelte|\/src\/|\/assets\/index-/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});

test('Maze package: rendered fit transforms, cell relayout and unheighted host proportions', async ({ page, packages }) => {
  for (const fit of ['regenerate', 'contain', 'cover', 'fixed']) {
    await openPackage(page, packages.origins[0], 'arrow-maze', { fit, cell: '40', playback: 'static' });
    const first = await state(page);
    const mapping = await page.locator('spielwerk-artwork svg').evaluate((svg: SVGSVGElement) => {
      const matrix = svg.getScreenCTM()!;
      return { scale: matrix.a, x: matrix.e, y: matrix.f };
    });
    if (fit === 'regenerate') {
      expect(first.dimensions).toEqual({ width: 400, height: 300 });
      expect(mapping).toEqual({ scale: 1, x: 0, y: 0 });
      expect(await page.evaluate(() => { const scene = (document.querySelector('spielwerk-artwork') as any).frame.scene; return [scene.columns, scene.cell]; })).toEqual([10, 37.5]);
    } else {
      expect(first.dimensions).toEqual({ width: 600, height: 800 });
      const expected = fit === 'contain' ? [0.375, 87.5, 0] : fit === 'cover' ? [2 / 3, 0, -350 / 3] : [1, -100, -250];
      for (const [i, value] of Object.values(mapping).entries()) expect(value).toBeCloseTo(expected[i], 2);
    }
    await page.evaluate(() => (document.querySelector('spielwerk-artwork') as HTMLElement).style.setProperty('width', '800px', 'important'));
    await expect.poll(() => page.locator('spielwerk-artwork').evaluate(el => el.getBoundingClientRect().width)).toBe(800);
    await page.waitForTimeout(100);
    if (fit === 'regenerate') {
      await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 800 300');
      expect(await page.evaluate(() => (document.querySelector('spielwerk-artwork') as any).frame.scene.columns)).toBe(20);
    } else expect((await state(page)).svg).toBe(first.svg);
    await page.locator('spielwerk-artwork').screenshot({ path: `.flow/tmp/final-maze-${fit}.png` });
  }
  await openPackage(page, packages.origins[1], 'arrow-maze', { playback: 'static' });
  await page.evaluate(() => { const el = document.querySelector('spielwerk-artwork') as HTMLElement; el.style.height = 'auto'; el.style.aspectRatio = ''; });
  await expect.poll(() => page.locator('spielwerk-artwork').evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(400 * 800 / 600, 1);
  await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 400 533');
});
