import { test, expect, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer, url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });
const pause = (page: Page) => page.getByRole('button', { name: 'Pause motion', exact: true });
const play = (page: Page) => page.getByRole('button', { name: 'Play motion', exact: true });
const visual = (page: Page) => page.getByTestId('scene').evaluate(host => {
  const canvas = host.querySelector('canvas');
  return canvas ? canvas.toDataURL() : host.innerHTML;
});

test('Liquid Gradients opens first and autoplays; pause works and navigation restarts playback', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('combobox', { name: 'Tool', exact: true })).toHaveValue('liquid-gradients');
  await expect(page.getByRole('combobox', { name: 'Tool', exact: true }).locator('option').first()).toHaveAttribute('value', 'liquid-gradients');
  await expect(pause(page)).toBeVisible();
  const first = await visual(page);
  await expect.poll(() => visual(page)).not.toBe(first);
  await pause(page).click();
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  const paused = await visual(page);
  await page.waitForTimeout(120); expect((await visual(page)) === paused).toBe(true);
  await play(page).click(); await expect.poll(() => visual(page)).not.toBe(paused);
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('truchet-tiles');
  await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
  await expect(pause(page)).toHaveCount(0); await expect(play(page)).toHaveCount(0);
  const still = await visual(page); await page.waitForTimeout(120);
  expect((await visual(page)) === still).toBe(true);
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('liquid-gradients');
  await expect(pause(page)).toBeVisible();
  await page.goto(url + '#not-a-tool');
  await expect(page.getByRole('heading', { name: 'Liquid Gradients', exact: true })).toBeVisible();
  await expect(pause(page)).toBeVisible();
});

for (const id of ['liquid-gradients', 'arrow-maze', 'arrow-poster', 'arrow-comb', 'arrow-field', 'switchboard', 'imprint', 'stripe-marquee']) {
  test(`${id}: moving defaults, explicit link, and saved-off settings start animated`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(id => localStorage.setItem(id, JSON.stringify({ motion: 'none', seed: 73, wpx: 320, hpx: 240, ...(id === 'switchboard' ? { st: [] } : {}) })), id);
    await page.goto(url + '#' + id);
    await expect(page.getByRole('combobox', { name: 'Tool', exact: true })).toHaveValue(id);
    await expect(pause(page)).toBeVisible();
    const defaults = await page.evaluate(async id => {
      const { generators } = await import('/src/tools/registry.ts');
      const tool = generators.find(tool => tool.id === id)!;
      return { motion: tool.adapter.defaults.motion, saved: JSON.parse(localStorage.getItem(id)!) };
    }, id);
    expect(defaults.motion).not.toBe('none');
    expect(defaults.saved.motion).toBe(defaults.motion);
    expect(defaults.saved.seed).toBe(73);
    const first = await visual(page);
    await expect.poll(() => visual(page)).not.toBe(first);
    await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('none');
    await expect(play(page)).toBeVisible();
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
    const still = await visual(page); await page.waitForTimeout(100);
    expect((await visual(page)) === still).toBe(true);
    // Manual play enables the tool's moving default again.
    await play(page).click(); await expect(pause(page)).toBeVisible();
    await expect.poll(() => visual(page)).not.toBe(still);
    expect(errors).toEqual([]);
  });
}

test('saved moving modes survive opening, while restoring a still snapshot pauses playback', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('arrow-field', JSON.stringify({ motion: 'spin', seed: 84, wpx: 320, hpx: 240 })));
  await page.goto(url + '#arrow-field');
  const motion = page.getByRole('combobox', { name: 'Motion', exact: true });
  await expect(pause(page)).toBeVisible();
  await expect(motion).toHaveValue('spin');
  await motion.selectOption('none');
  await expect(play(page)).toBeVisible();
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByLabel('Snapshot name').fill('Still');
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load Still', exact: true })).toBeVisible();
  await play(page).click(); await expect(pause(page)).toBeVisible();
  await page.getByRole('button', { name: 'Load Still', exact: true }).click();
  await expect(motion).toHaveValue('none');
  await expect(play(page)).toBeVisible();
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  const still = await visual(page); await page.waitForTimeout(100);
  expect((await visual(page)) === still).toBe(true);
  await expect(page.getByLabel('Seed exact', { exact: true })).toHaveValue('84');
});

test('reduced motion disables autoplay without disabling explicit play; changes pause the running tool', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await expect(page.getByTestId('scene').locator('canvas')).toBeVisible();
  await expect(play(page)).toBeVisible();
  const still = await visual(page); await page.waitForTimeout(100);
  expect((await visual(page)) === still).toBe(true);
  await play(page).click(); await expect.poll(() => visual(page)).not.toBe(still);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(play(page)).toBeVisible();
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  const paused = await visual(page); await page.waitForTimeout(100);
  expect((await visual(page)) === paused).toBe(true);
});
