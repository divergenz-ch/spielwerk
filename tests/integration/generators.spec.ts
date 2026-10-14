import { test, expect, tools, openPackage, seek } from '../embeds/package-fixture';

// Final cross-spec gate consumes downloaded fn-5 packages, not runtime declarations.
test('the complete generator catalog delivers responsive, deterministic visual-only website artwork', async ({ page, packages }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  for (const [index, id] of tools.entries()) {
    const origin = packages.origins[index % 2];
    const start = requests.length;
    await openPackage(page, origin, id);
    const first = await seek(page, 0.125);
    expect(first.dimensions).toEqual({ width: 400, height: 300 });
    expect((await seek(page, 0.125)).svg === first.svg).toBe(true);
    await page.evaluate(() => { const el = document.querySelector('spielwerk-artwork') as HTMLElement; el.style.setProperty('width', '800px', 'important'); el.style.height = '400px'; });
    await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 800 400');
    const resized = await seek(page, 0.125);
    expect(resized.svg === first.svg).toBe(false);
    const later = await seek(page, 0.375);
    expect(later.svg === resized.svg).toBe(id === 'truchet-tiles');
    await expect(page.locator('spielwerk-artwork input, spielwerk-artwork button, spielwerk-artwork [contenteditable]')).toHaveCount(0);
    const local = requests.slice(start);
    expect(local.every(url => url.startsWith(origin))).toBe(true);
    expect(local.some(url => url.endsWith('.wasm'))).toBe(true);
    expect(local.some(url => /\.svelte|\/src\/|\/assets\/index-/.test(url))).toBe(false);
  }
  expect(errors).toEqual([]);
});
