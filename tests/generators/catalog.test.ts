import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
let server: ViteDevServer, url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });
const ids = ['arrow-maze', 'arrow-poster', 'arrow-comb', 'arrow-field', 'switchboard', 'truchet-tiles', 'imprint', 'stripe-marquee'];

test('delivered catalog binds eight real engines, supported artwork and website package handlers', async ({ page }) => {
  await page.goto(url);
  const result = await page.evaluate(async () => {
    const { generators, exporters } = await import('/src/tools/registry.ts');
    const { supportedFormats } = await import('/src/workspace/exports.ts');
    const results = [];
    for (const tool of generators) {
      const adapter = tool.adapter;
      const input = { design: { toolId: tool.id, params: adapter.defaults, seed: 42, assets: [], artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } } }, timeSeconds: 0.125 };
      const first = await adapter.evaluate(input), repeat = await adapter.evaluate(input);
      const wide = await adapter.evaluate({ ...input, design: { ...input.design, artboard: { mode: 'responsive', dimensions: { width: 800, height: 300 } } } });
      results.push({ id: tool.id, status: tool.status, controls: adapter.controls.length,
        formats: supportedFormats(adapter, exporters[tool.id]), repeat: JSON.stringify(first) === JSON.stringify(repeat),
        dimensions: first.dimensions, wide: wide.dimensions,
        changed: first.scene.svg !== wide.scene.svg, visible: /<(path|polygon|line|circle|rect)/.test(first.scene.svg),
      });
    }
    return results;
  });
  expect(result.map(item => item.id)).toEqual(ids);
  for (const item of result) {
    expect(item.status).toBe('ready'); expect(item.controls).toBeGreaterThan(0);
    expect(item.formats).toEqual(['truchet-tiles', 'imprint'].includes(item.id) ? ['svg', 'png', 'embed'] : ['svg', 'png', 'gif', 'embed']);
    expect(item.repeat).toBe(true); expect(item.visible).toBe(true); expect(item.changed).toBe(true);
    expect(item.dimensions).toEqual({ width: 400, height: 300 }); expect(item.wide).toEqual({ width: 800, height: 300 });
  }
  for (const id of ['logo-extruder', 'font-remixer']) {
    await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption(id);
    await expect(page.getByRole('option', { name: 'Website embed (ZIP)', exact: true })).toHaveCount(0);
  }
});
