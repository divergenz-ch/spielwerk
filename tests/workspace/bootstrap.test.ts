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
    const requests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => errors.push(request.url()));
    page.on('request', (request) => requests.push(request.url()));
    page.on('response', (response) => {
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
    await expect(page.getByRole('region', { name: 'Workspace foundation' })).toContainText(
      'Design tools are not available yet.',
    );
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(233, 231, 226)');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
    expect(assetResponses.length).toBeGreaterThan(0);
    for (const asset of assetResponses) {
      expect(asset.status, asset.url).toBe(200);
      expect(asset.type, asset.url).toMatch(/javascript|css/);
      if (mode === 'static subdirectory') expect(asset.url).toContain('/workspace/assets/');
    }
    expect(requests.every((request) => request.startsWith(url))).toBe(true);
    expect(requests.some((request) => new URL(request).pathname.startsWith('/snaps/'))).toBe(false);
  });
}
