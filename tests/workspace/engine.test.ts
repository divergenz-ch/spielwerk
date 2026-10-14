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

  directory = await mkdtemp(join(tmpdir(), 'spielwerk-engine-'));
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
  test(`Svelte calls Rust geometry and font parsing: ${mode}`, async ({ page }) => {
    const root = mode === 'development' ? devUrl
      : staticUrl + (mode === 'static subdirectory' ? 'workspace/' : '');
    const errors: string[] = [];
    const wasmResponses: { url: string; status: number; mime: string }[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', request => errors.push(request.url()));
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.pathname.endsWith('.wasm') && !url.searchParams.has('url')) {
        wasmResponses.push({
          url: response.url(), status: response.status(),
          mime: response.headers()['content-type'] ?? '',
        });
      }
    });
    await page.goto(root + 'src/engine/probe.html');
    await expect(page.getByTestId('frames')).not.toBeEmpty();
    const { first, repeated, resized, later } = JSON.parse(
      (await page.getByTestId('frames').textContent())!,
    );
    expect(repeated).toEqual(first);
    expect(first.dimensions).toEqual({ width: 120, height: 80 });
    expect(first.timeSeconds).toBe(0.5);
    expect(first.durationSeconds).toBe(2);
    expect(first.scene.phase).toBe(0.25);
    expect(first.scene.rectangles).toHaveLength(6);
    expect(first.scene.rectangles[0].x).toBe(2.5);
    expect(resized.scene.rectangles).toHaveLength(10);
    expect(resized.scene.rectangles[0].width).toBe(first.scene.rectangles[0].width);
    expect(later.scene.phase).toBe(0.5);
    expect(later.scene.rectangles[0].x).toBe(5);
    await expect(page.locator('svg rect')).toHaveCount(6);
    await expect(page.locator('svg rect').first()).toHaveAttribute('x', '2.5');
    await expect(page.locator('svg')).toHaveAttribute('viewBox', '0 0 120 80');

    await page.getByLabel('Font boundary probe').setInputFiles(
      'crates/spielwerk-engine/tests/fixtures/metrics.ttf',
    );
    await expect(page.getByTestId('font')).toHaveText('{"unitsPerEm":1000,"glyphCount":1}');
    await page.getByLabel('Font boundary probe').setInputFiles({
      name: 'invalid.ttf', mimeType: 'font/ttf', buffer: Buffer.from([0, 1, 2]),
    });
    await expect(page.getByTestId('font')).toHaveText('Invalid OpenType font');
    expect(wasmResponses).toHaveLength(1);
    expect(wasmResponses[0].status).toBe(200);
    expect(wasmResponses[0].mime).toContain('application/wasm');
    expect(wasmResponses[0].url.startsWith(root)).toBe(true);
    expect(errors).toEqual([]);
    await expect(page.getByRole('alert')).toBeEmpty();
  });
}

test('a missing Wasm asset cannot succeed through a JavaScript proxy', async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort());
  await page.goto(staticUrl + 'src/engine/probe.html');
  await expect(page.getByRole('alert')).not.toBeEmpty();
  await expect(page.getByTestId('frames')).toBeEmpty();
  await expect(page.locator('svg')).toHaveCount(0);
});

test('catalog separates planned tool capabilities from delivered engines', async () => {
  const { tools } = await import('../../src/workspace/registry');
  expect(tools.map(tool => tool.id)).toEqual([
    'arrow-maze', 'arrow-poster', 'arrow-comb', 'switchboard', 'truchet-tiles',
    'arrow-field', 'imprint', 'logo-extruder', 'stripe-marquee', 'font-remixer',
  ]);
  for (const tool of tools) {
    expect(tool.status).toBe('pending');
    expect(tool.adapter).toBeNull();
    expect(tool.description.length).toBeGreaterThan(0);
    expect(tool.intendedCapabilities.responsive).toBe(tool.owner === 'generators');
    expect(tool.intendedCapabilities.formats.includes('embed')).toBe(tool.owner === 'generators');
  }
  expect(tools.find(tool => tool.id === 'imprint')!.intendedCapabilities.formats)
    .toEqual(['svg', 'png', 'embed']);
  expect(tools.find(tool => tool.id === 'truchet-tiles')!.intendedCapabilities.motion).toBe(false);
  expect(tools.find(tool => tool.id === 'logo-extruder')!.intendedCapabilities.formats)
    .toEqual(['png', 'gif']);
  expect(tools.find(tool => tool.id === 'font-remixer')!.intendedCapabilities.formats)
    .toEqual(['svg', 'png', 'otf', 'variable-font']);
});
