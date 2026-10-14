import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dev: ViteDevServer;
let staticHost: ChildProcess;
let directory: string;
let devUrl: string;
let staticUrl: string;

test.beforeAll(async () => {
  dev = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await dev.listen();
  devUrl = dev.resolvedUrls!.local[0];

  directory = await mkdtemp(join(tmpdir(), 'spielwerk-bootstrap-'));
  await cp('dist', directory, { recursive: true });
  await cp('dist', join(directory, 'workspace'), { recursive: true });
  staticHost = spawn('python3', [
    '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', directory,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  staticHost.stderr!.resume();
  staticUrl = await new Promise<string>((resolve, reject) => {
    let output = '';
    staticHost.once('error', reject);
    staticHost.once('exit', (code) => reject(new Error(`Static host exited: ${code}`)));
    staticHost.stdout!.on('data', (chunk) => {
      output += chunk.toString();
      const port = output.match(/port (\d+)/)?.[1];
      if (port) resolve(`http://127.0.0.1:${port}/`);
    });
  });
});

test.afterAll(async () => {
  if (staticHost?.pid && staticHost.exitCode === null) {
    const exited = once(staticHost, 'exit');
    staticHost.kill();
    await exited;
  }
  await dev?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

for (const mode of ['development', 'static root', 'static subdirectory'] as const) {
  test(`mounts the workspace with resolved assets: ${mode}`, async ({ page }) => {
    const url = mode === 'development' ? devUrl
      : staticUrl + (mode === 'static subdirectory' ? 'workspace/' : '');
    const errors: string[] = [];
    const assetResponses: { url: string; status: number; type: string }[] = [];
    const discovery: { url: string; status: number; body: Promise<string> }[] = [];
    const consoleErrors: { text: string; url: string }[] = [];
    const discoveryUrl = new URL('/snaps/ping', url).href;
    const requests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url });
    });
    page.on('requestfailed', (request) => errors.push(request.url()));
    page.on('request', (request) => requests.push(request.url()));
    page.on('response', (response) => {
      if (response.url() === discoveryUrl) discovery.push({ url: response.url(), status: response.status(), body: response.text() });
      if (['script', 'stylesheet'].includes(response.request().resourceType())) {
        assetResponses.push({
          url: response.url(), status: response.status(),
          type: response.headers()['content-type'] ?? '',
        });
      }
    });

    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Spielwerk', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Composition preview' })).toBeVisible();
    await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toBeVisible();
    await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('arrow-poster');
    await expect(page.getByRole('heading', { name: 'Arrow Poster', exact: true })).toBeVisible();
    await expect(page.getByTestId('scene').locator('[data-arrow] path').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Workspace foundation' })).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('arrow-maze');
    await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(233, 233, 230)');
    await page.waitForLoadState('networkidle');
    // Initial Maze, delivered Poster, then Maze each discover snapshot storage.
    expect(discovery).toHaveLength(3);
    for (const response of discovery) {
      expect(response.status).toBe(mode === 'development' ? 200 : 404);
      expect(await response.body).not.toBe('"ok"');
    }
    await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
    await page.getByLabel('Snapshot name', { exact: true }).fill('local bootstrap');
    await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Load local bootstrap', exact: true })).toBeVisible();
    const local = await page.evaluate(() => new Promise<any[]>(resolve => {
      const request = indexedDB.open('spielwerk', 1);
      request.onsuccess = () => {
        const db = request.result;
        const read = db.transaction('kv').objectStore('kv').get('snaps:arrow-maze');
        read.onsuccess = () => { resolve(read.result); db.close(); };
      };
    }));
    expect(local.map(snapshot => snapshot.name)).toEqual(['local bootstrap']);
    const allowedResourceError = 'Failed to load resource: the server responded with a status of 404 (File not found)';
    const expectedConsoleErrors = mode === 'development' ? [] : discovery.map(() => ({ text: allowedResourceError, url: discoveryUrl }));
    expect(consoleErrors).toEqual(expectedConsoleErrors);
    expect(errors).toEqual([]);
    expect(assetResponses.length).toBeGreaterThan(0);
    for (const asset of assetResponses) {
      expect(asset.status, asset.url).toBe(200);
      expect(asset.type, asset.url).toMatch(/javascript|css/);
      if (mode === 'static subdirectory') expect(asset.url).toContain('/workspace/assets/');
    }
    expect(requests.every((request) => request.startsWith(url) || request === discoveryUrl)).toBe(true);
    expect(requests.filter(request => new URL(request).pathname.startsWith('/snaps/'))).toEqual([discoveryUrl, discoveryUrl, discoveryUrl]);
  });
}
