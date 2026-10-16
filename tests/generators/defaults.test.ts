import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer, url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

// Protect the art direction, not just the presence of a background rectangle.
const compositions = {
  'liquid-gradients': { scale: 0.65, distortion: 0.65, softness: 0.75, c1: '#2516a6', speed: 0.6 },
  'arrow-maze': { cols: 20, panels: 6, amount: 90, shaft: 32, ink: '#263bcb' },
  'arrow-poster': { count: 7, size: 75, steps: 6, cwidth: 1.2, color: '#292146' },
  'arrow-comb': { bands: 2, count: 36, profile: 'swirl', textMid: 'IN|MOTION', ink: '#e54b2c' },
  'arrow-field': { field: 'swirl', motion: 'spin', cols: 18, len: 85, duo: 30, ink: '#d5ed80' },
  switchboard: { gap: 20, jitter: 15, links: 16, radius: 1.1, on: '#d7ed77' },
  'truchet-tiles': { cols: 6, lines: 3, duo: 30, ink: '#24594d' },
  imprint: { rays: 32, stroke: 1.2, depth: 0.5, scatter: 0, paper: '#d8ccdf' },
  'stripe-marquee': { text: 'PLAY', fit: 'fit width', rows: 88, rowgap: 8, paper: '#201b32' },
};

test('curated defaults are canonical and generate deterministic artwork without uploaded assets', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  const results = await page.evaluate(async () => {
    const { generators } = await import('/src/tools/registry.ts');
    const { controlSettings } = await import('/src/workspace/view.ts');
    const results = [];
    for (const tool of generators) {
      const defaults = tool.adapter.defaults;
      const normalized = controlSettings(tool.adapter.controls, defaults, tool.prepareSettings?.({}) ?? {});
      const input = { design: { toolId: tool.id, params: defaults, seed: Number(defaults.seed), assets: [], artboard: { mode: 'fixed', dimensions: tool.artboard.initial } }, timeSeconds: 0 };
      const frame = await tool.adapter.evaluate(input);
      const repeat = await tool.adapter.evaluate(input);
      results.push({ id: tool.id, defaults, normalized, initial: tool.artboard.initial,
        repeat: JSON.stringify(frame) === JSON.stringify(repeat),
        invalid: /NaN|Infinity/.test(JSON.stringify(frame)),
        unplaced: frame.scene.unplaced ?? [],
      });
    }
    return results;
  });
  expect(results.map(result => result.id).sort()).toEqual(Object.keys(compositions).sort());
  for (const result of results) {
    expect(result.defaults).toMatchObject(compositions[result.id]);
    expect(result.normalized).toEqual(result.defaults);
    expect(result.initial).toEqual({ width: result.defaults.wpx, height: result.defaults.hpx });
    expect(result.repeat).toBe(true); expect(result.invalid).toBe(false); expect(result.unplaced).toEqual([]);
  }
});

for (const id of Object.keys(compositions)) {
  test(`${id}: fresh composition, parameter reset and preservation of a customized design`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url + '#' + id);
    const scene = page.getByTestId('scene');
    await expect(scene.locator('svg, canvas').first()).toBeVisible();
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
    const { defaults, geometry, color } = await page.evaluate(async id => {
      const { generators } = await import('/src/tools/registry.ts');
      const { adapter } = generators.find(tool => tool.id === id)!;
      return { defaults: adapter.defaults,
        geometry: adapter.controls.find(control => control.type === 'number' && control.key !== 'seed')!,
        color: adapter.controls.find(control => control.type === 'color')!,
      };
    }, id);
    const saved = () => page.evaluate(id => JSON.parse(localStorage.getItem(id)!), id);
    expect(await saved()).toMatchObject(defaults);
    await testInfo.attach('initial-artwork', { body: await scene.screenshot(), contentType: 'image/png' });

    const seed = page.getByRole('spinbutton', { name: 'Seed exact', exact: true });
    await seed.fill('8888'); await seed.press('Tab');
    await page.getByRole('button', { name: 'Reset Seed', exact: true }).click();
    await expect(seed).toHaveValue(String(defaults.seed));

    const parameter = page.getByRole('spinbutton', { name: `${geometry.label} exact`, exact: true });
    const value = Number((Number(defaults[geometry.key]) + geometry.step * 2).toFixed(10));
    await parameter.fill(String(value)); await parameter.press('Tab');
    const palette = page.getByLabel(color.label, { exact: true });
    await palette.fill('#abcdef'); await palette.press('Tab');
    await seed.fill('8888'); await seed.press('Tab');
    await page.reload();
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
    await expect(seed).toHaveValue('8888');
    await expect(parameter).toHaveValue(String(value));
    await expect(palette).toHaveValue('#abcdef');
    expect(await saved()).toMatchObject({ seed: 8888, [geometry.key]: value, [color.key]: '#abcdef' });
    expect(errors).toEqual([]);
  });
}
