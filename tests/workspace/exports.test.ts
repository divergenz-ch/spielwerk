import { test, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let directory: string;
let staticUrl: string;
let serviceUrl: string;
const processes: ChildProcess[] = [];
const errors = new WeakMap<Page, string[]>();
async function host(args: string[], cwd?: string) {
  const child = spawn('python3', ['-u', ...args], { cwd, env: { ...process.env, HOME: directory }, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.push(child); child.stderr!.resume();
  return new Promise<string>((resolve, reject) => {
    let output = '';
    child.once('error', reject); child.once('exit', code => reject(Error(`Host exited ${code}`)));
    child.stdout!.on('data', chunk => {
      output += chunk;
      const port = output.match(/PORT=(\d+)/)?.[1] ?? output.match(/port (\d+)/)?.[1];
      if (port) resolve(`http://127.0.0.1:${port}/`);
    });
  });
}
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'spielwerk-exports-'));
  const entry = join(directory, 'entry.js');
  await writeFile(entry, `
    import { mount } from ${JSON.stringify(resolve('node_modules/svelte/src/index-client.js'))};
    import App from ${JSON.stringify(resolve('src/workspace/App.svelte'))};
    import { evaluateFixture } from ${JSON.stringify(resolve('src/engine/client.ts'))};
    import { exportArtwork } from ${JSON.stringify(resolve('src/workspace/exports.ts'))};
    window.inputs = []; window.encoded = []; window.writes = [];
    const adapter = {
      id: '__fixture__', defaults: { cellSize: 40 },
      controls: [{ key: 'cellSize', label: 'Cell size', group: 'Geometry', type: 'number', min: 10, max: 80, step: 5 }],
      dimensions: { width: { min: 40, max: 400 }, height: { min: 40, max: 300 } },
      capabilities: { responsive: true, motion: true, formats: ['svg', 'png', 'gif', 'otf'] },
      async evaluate(input) { window.inputs.push(input); return evaluateFixture(input); }
    };
    const handlers = Object.fromEntries(['svg', 'png', 'gif', 'embed'].map(format => [format, async context => {
      context.progress('Fixture encoding 1/2');
      if (window.hold) await new Promise(resolve => window.release = resolve);
      if (window.fail) throw Error('fixture encoder failure');
      const later = await context.evaluate(0.5);
      const record = { format, input: context.input, frame: context.frame, later,
        bytes: context.input.design.assets.map(asset => Array.from(asset.bytes)) };
      window.encoded.push(record);
      return { name: 'internal-' + format + '-contract.json', blob: new Blob([JSON.stringify(record)], { type: 'application/json' }) };
    }]));
    window.rejectUnsupported = () => exportArtwork(adapter, handlers, 'embed', window.inputs[0], () => {});
    window.start = (folder = false) => {
      Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: folder ? async options => {
        window.pickerOptions = options;
        if (window.cancel) throw new DOMException('cancelled', 'AbortError');
        if (window.denyPicker) throw new DOMException('denied', 'NotAllowedError');
        return { name: 'Disposable fixture folder', async getFileHandle(name) {
          if (window.denyWrite) throw new DOMException('permission revoked', 'NotAllowedError');
          return { async createWritable() { return { async write(blob) { window.writes.push({ name, text: await blob.text() }); }, async close() { window.writeClosed = true; } }; } };
        } };
      } : undefined });
      mount(App, { target: document.body, props: { exporters: { 'internal-export-fixture': handlers }, catalog: [{
        id: 'internal-export-fixture', name: 'Internal export fixture', description: 'Contract files, not delivered SVG/PNG/GIF encoders', status: 'ready', accent: true, adapter,
        artboard: { initial: { width: 120, height: 80 }, dimensions: true, presets: [], swap: false, ratioLock: false, handles: [] },
        renderer: { render(frame, target) { target.textContent = frame.scene.rectangles.length + ' full-detail rectangles'; } }
      }] } });
    };
  `);
  await build({ configFile: false, plugins: [svelte()], resolve: { dedupe: ['svelte'] }, build: { outDir: join(directory, 'fixture'), lib: { entry, formats: ['es'], fileName: 'fixture' } } });
  const files = await readdir(join(directory, 'fixture'));
  await writeFile(join(directory, 'fixture/index.html'), `<!doctype html><title>Export contract fixture</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./fixture.css"><script type="module" src="./${files.find(f => f.endsWith('.js'))}"></script>`);
  await cp('dist', join(directory, 'app'), { recursive: true });
  await cp('serve.py', join(directory, 'serve.py'));
  staticUrl = await host(['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', directory]);
  serviceUrl = await host(['-c', 'import serve; s=serve.ThreadingHTTPServer(("127.0.0.1",0),serve.Handler); print("PORT="+str(s.server_port),flush=True); s.serve_forever()'], directory);
});
test.afterAll(async () => {
  for (const child of processes) if (child.pid && child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
  if (directory) await rm(directory, { recursive: true, force: true });
});
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('404')) messages.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });
async function start(page: Page, folder = false, base = staticUrl) {
  await page.goto(base + 'fixture/');
  await page.waitForFunction(() => (window as any).start);
  await page.evaluate(folder => (window as any).start(folder), folder);
  await expect(page.getByTestId('scene')).toHaveText('6 full-detail rectangles');
}
async function edit(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel(label, { exact: true }).press('Tab');
}

for (const hosting of ['static', 'service']) {
  test(`built application and live responsive SVG/PNG/GIF contract downloads: ${hosting}`, async ({ page }) => {
    const base = hosting === 'static' ? staticUrl : serviceUrl;
    await page.goto(base + 'app/');
    await expect(page.getByRole('heading', { name: 'Spielwerk', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Composition preview' })).toBeVisible();
    await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toBeVisible();
    expect(await page.getByLabel('Output format').locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value))).toEqual(['svg', 'png', 'gif', 'embed']);
    await start(page, false, base);
    await expect(page.getByRole('button', { name: 'Choose export folder' })).toHaveCount(0);
    expect(await page.getByLabel('Output format').locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value))).toEqual(['svg', 'png', 'gif']);
    await expect(page.evaluate(() => (window as any).rejectUnsupported())).rejects.toThrow('This output format is not available');
    await page.getByLabel('Layout', { exact: true }).selectOption('responsive');
    await edit(page, 'Container width', '200'); await edit(page, 'Container height', '120');
    await edit(page, 'Cell size exact', '20');
    await page.getByLabel('Zoom', { exact: true }).selectOption('200');
    await expect(page.getByTestId('scene')).toHaveText('60 full-detail rectangles');
    const preview = await page.evaluate(() => (window as any).inputs.at(-1));
    const records = [];
    for (const format of ['svg', 'png', 'gif']) {
      await page.getByLabel('Output format').selectOption(format);
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
      const file = await downloaded;
      expect(file.suggestedFilename()).toBe('internal-' + format + '-contract.json');
      records.push(JSON.parse(await readFile((await file.path())!, 'utf8')));
      await expect(page.getByRole('status', { name: 'Export progress' })).toContainText('browser downloads');
    }
    for (const record of records) {
      expect(record.input).toEqual(preview);
      expect(record.input.design.artboard).toEqual({ mode: 'responsive', dimensions: { width: 200, height: 120 } });
      expect(record.frame.dimensions).toEqual({ width: 200, height: 120 });
      expect(record.frame.timeSeconds).toBe(0); expect(record.later.timeSeconds).toBe(0.5);
      expect(record.frame.scene.rectangles).toHaveLength(60);
      expect(record.input.design.params).not.toHaveProperty('zoom');
      expect(record.frame).toEqual(records[0].frame); expect(record.later).toEqual(records[0].later);
    }
    await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Load snapshot 1', exact: true })).toBeVisible();
    if (hosting === 'service') {
      const saved = JSON.parse(await readFile(join(directory, 'Documents/spielwerk-snapshots/internal-export-fixture.json'), 'utf8'));
      expect(saved[0].params.vw).toBe(200);
    } else {
      expect((await page.request.get(base + 'snaps/ping')).status()).toBe(404);
    }
  });
}

test('progress, visible encoder failure, original typeface bytes, and immutable in-flight fixed request', async ({ page }) => {
  await start(page);
  let font: Buffer | undefined;
  for (const path of ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf']) {
    try { font = await readFile(path); break; } catch { /* try next platform */ }
  }
  expect(font, 'A real browser-loadable font is required').toBeDefined();
  for (const slot of ['Primary', 'Accent']) await page.getByLabel(`${slot} typeface`, { exact: true }).setInputFiles({ name: `${slot}.ttf`, mimeType: 'font/ttf', buffer: font! });
  await expect.poll(() => page.evaluate(() => (window as any).inputs.at(-1).design.assets.length)).toBe(2);
  await page.evaluate(() => { (window as any).hold = true; });
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Export progress' })).toHaveText('Fixture encoding 1/2');
  await expect(page.getByRole('button', { name: 'Export artwork', exact: true })).toBeDisabled();
  await edit(page, 'Width', '200');
  const downloaded = page.waitForEvent('download');
  await page.evaluate(() => (window as any).release());
  const record = JSON.parse(await readFile((await (await downloaded).path())!, 'utf8'));
  expect(record.input.design.artboard).toEqual({ mode: 'fixed', dimensions: { width: 120, height: 80 } });
  expect(record.later.dimensions).toEqual({ width: 120, height: 80 });
  expect(record.input.design.assets.map((a: any) => a.role)).toEqual(['typeface', 'accent-typeface']);
  for (const bytes of record.bytes) expect(Buffer.from(bytes)).toEqual(font);
  await page.evaluate(() => { (window as any).hold = false; (window as any).fail = true; });
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Export failed: Error: fixture encoder failure');
  await expect(page.getByRole('button', { name: 'Export artwork', exact: true })).toBeEnabled();
});

test('folder cancellation retains destination; picker/write permissions fall back to downloads', async ({ page }) => {
  await start(page, true);
  const pick = page.getByRole('button', { name: 'Choose export folder' });
  await page.evaluate(() => { (window as any).cancel = true; });
  await pick.click();
  await expect(page.getByText('Destination: browser downloads', { exact: true })).toBeVisible();
  await page.evaluate(() => { (window as any).cancel = false; (window as any).denyPicker = true; });
  await pick.click();
  await expect(page.getByRole('alert')).toContainText('Folder selection failed:');
  let downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('internal-svg-contract.json');
  await page.evaluate(() => { (window as any).denyPicker = false; });
  await pick.click();
  expect(await page.evaluate(() => (window as any).pickerOptions)).toEqual({ id: 'spielwerk-export', mode: 'readwrite' });
  await page.evaluate(() => { (window as any).cancel = true; });
  await pick.click();
  await expect(page.getByText('Destination: Disposable fixture folder', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Export progress' })).toContainText('Disposable fixture folder');
  expect(await page.evaluate(() => (window as any).writeClosed)).toBe(true);
  const writes = await page.evaluate(() => (window as any).writes);
  expect(writes).toHaveLength(1); expect(JSON.parse(writes[0].text).frame.scene.rectangles).toHaveLength(6);
  await page.evaluate(() => { (window as any).denyWrite = true; });
  downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await downloaded;
  await expect(page.getByRole('alert')).toContainText('Folder output failed:');
  await expect(page.getByRole('alert')).toContainText('Used browser download instead.');
  await expect(page.getByText('Destination: Disposable fixture folder', { exact: true })).toBeVisible();
});
