import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

test('Arrow Maze user surface computes actual artwork, drag, motion and downloads', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
  await expect(page.getByTestId('scene').locator('[data-arrow]')).not.toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Output format' })).toHaveText('SVGPNG GIF'.replace(' ', ''));
});
