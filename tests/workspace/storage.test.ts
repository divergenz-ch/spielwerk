import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let directory: string;
let script: string;
let staticUrl: string;
let serviceUrl: string;
const processes: ChildProcess[] = [];

async function host(args: string[], env = process.env) {
  const child = spawn('python3', ['-u', ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.push(child);
  child.stderr!.resume();
  return new Promise<string>((resolve, reject) => {
    let output = '';
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Host exited ${code}`)));
    child.stdout!.on('data', chunk => {
      output += chunk;
      const port = output.match(/PORT=(\d+)/)?.[1] ?? output.match(/port (\d+)/)?.[1];
      if (port) resolve(`http://127.0.0.1:${port}/`);
    });
  });
}

test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'spielwerk-storage-'));
  const entry = join(directory, 'entry.js');
  await writeFile(entry, `
    import { mount } from ${JSON.stringify(resolve('node_modules/svelte/src/index-client.js'))};
    import Panel from ${JSON.stringify(resolve('src/workspace/SnapshotsPanel.svelte'))};
    import * as storage from ${JSON.stringify(resolve('src/workspace/storage.ts'))};
    import * as snapshots from ${JSON.stringify(resolve('src/workspace/snapshots.ts'))};
    import * as fonts from ${JSON.stringify(resolve('src/workspace/fonts.ts'))};
    window.api = { ...storage, ...snapshots, ...fonts };
    window.mountPanel = (slug) => mount(Panel, { target: document.body, props: {
      slug, accent: true, onload: state => window.loaded = state,
      onfontchange: (slot, font) => { (window.fontChanges ??= {})[slot] = font; }
    }});
  `);
  await build({ configFile: false, plugins: [svelte()], resolve: { dedupe: ['svelte'] },
    build: { outDir: join(directory, 'dist'), lib: { entry, formats: ['es'], fileName: 'fixture' } },
  });
  const files = await readdir(join(directory, 'dist'));
  script = await readFile(join(directory, 'dist', files.find(file => file.endsWith('.js'))!), 'utf8');
  await writeFile(join(directory, 'dist/index.html'), '<!doctype html><title>Storage fixture</title>');
  staticUrl = await host(['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', join(directory, 'dist')]);
  serviceUrl = await host(['-c', 'import serve; s=serve.ThreadingHTTPServer(("127.0.0.1",0),serve.Handler); print("PORT="+str(s.server_port),flush=True); s.serve_forever()'],
    { ...process.env, HOME: directory });
});

test.afterAll(async () => {
  for (const child of processes) {
    if (child.pid && child.exitCode === null) {
      const exited = once(child, 'exit'); child.kill(); await exited;
    }
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

for (const context of ['static', 'service']) {
  test(`compatible settings, snapshots and font payloads: ${context}`, async ({ page }) => {
    await page.goto(context === 'static' ? staticUrl : serviceUrl);
    await page.addScriptTag({ content: script, type: 'module' });
    await page.waitForFunction(() => (window as any).api);
    const result = await page.evaluate(async () => {
      const a = (window as any).api;
      const p = a.browserPersistence();
      const slug = 'stripe-marquee';
      const original = { text: 'old', area: 1, stamp: 8, future: { retained: true }, zoom: 2, open: { ink: true } };
      localStorage.setItem(slug, JSON.stringify(original));
      localStorage.setItem('arrow-maze', JSON.stringify({ area: 1, columns: 14 }));
      const settings = a.settingsStore(slug, p);
      const restored = settings.load({ text: 'default', speed: 3 });
      settings.save({ text: 'new' }, { pan: { x: 2, y: 3 } });
      const font = { family: 'user-main', file: 'main.woff2', dataURL: 'data:font/woff2;base64,AQID' };
      const accent = { ...font, family: 'user-accent', file: 'accent.otf' };
      await p.kv.set('font:' + slug, font);
      await p.kv.set('font:' + slug + ':accent', accent);
      await p.kv.set('snaps:' + slug, [{ name: 'legacy', at: 1, params: { text: 'legacy', area: 1 }, font, accent }]);
      const library = a.snapshots(slug, p);
      const legacy = await library.list();
      const generated = await library.save(' ');
      settings.save({ text: 'overwritten' });
      await library.save(generated.name);
      const overwritten = await library.list();
      await library.load(legacy[0]);
      const loaded = settings.load();
      const loadedFonts = [await p.kv.get('font:' + slug), await p.kv.get('font:' + slug + ':accent')];
      let prompts = 0;
      const incoming = { tool: 'arrow-maze', snaps: [{ name: 'legacy', at: 2,
        params: { text: 'imported', area: 1, stamp: 12, zoom: 99, open: {}, pan: {}, expandedGroups: [] },
        font, accent, images: ['not included'], stamps: ['not included'], assets: [{ role: 'image' }] }] };
      const rejected = await library.import(incoming, () => { prompts++; return false; });
      const afterReject = await library.list();
      const accepted = await library.import(incoming, () => { prompts++; return true; });
      const exported = await library.export();
      await library.import({ ...incoming, tool: slug }, () => { throw Error('Same tool must not prompt'); });
      await library.remove(generated.name);
      return { restored, generated, overwritten, loaded, loadedFonts, rejected, accepted, prompts,
        afterReject, exported, remaining: await library.list(), other: a.settingsStore('arrow-maze', p).load(),
        missing: a.settingsStore('imprint', p).load({ ink: '#000' }), localSnaps: await p.kv.get('snaps:' + slug) };
    });
    expect(result.restored).toEqual({ params: { text: 'old', speed: 3, area: 1, stamp: 8, future: { retained: true } }, view: { zoom: 2, open: { ink: true } } });
    expect(result.generated.name).toBe('snapshot 2');
    expect(result.overwritten).toHaveLength(2);
    expect(result.overwritten[1].params.text).toBe('overwritten');
    expect(result.loaded.params.text).toBe('legacy');
    expect(result.loaded.params.future).toEqual({ retained: true });
    expect(result.loaded.view).toEqual({ zoom: 2, open: { ink: true }, pan: { x: 2, y: 3 } });
    expect(result.loadedFonts).toEqual([result.generated.font, result.generated.accent]);
    expect(result.rejected).toBe(false);
    expect(result.accepted).toBe(true);
    expect(result.prompts).toBe(2);
    expect(result.afterReject[0].params.text).toBe('legacy');
    expect(result.exported.tool).toBe('stripe-marquee');
    expect(result.exported.snaps[0]).toEqual({ name: 'legacy', at: 2, params: { text: 'imported', area: 1, stamp: 12 }, font: result.generated.font, accent: result.generated.accent });
    expect(result.remaining).toHaveLength(1);
    expect(result.other.params).toEqual({ area: 1, columns: 14 });
    expect(result.missing).toEqual({ params: { ink: '#000' }, view: {} });
    if (context === 'service') {
      expect(result.localSnaps).toEqual([]);
      expect(JSON.parse(await readFile(join(directory, 'Documents/spielwerk-snapshots/stripe-marquee.json'), 'utf8'))).toEqual(result.remaining);
    } else expect(result.localSnaps).toEqual(result.remaining);
  });
}

test('Svelte panel saves, restores, imports, exports and deletes through browser adapters', async ({ page }) => {
  await page.goto(staticUrl);
  await page.addScriptTag({ content: script, type: 'module' });
  await page.waitForFunction(() => (window as any).api);
  await page.evaluate(() => {
    localStorage.setItem('imprint', JSON.stringify({ text: 'original', zoom: 2 }));
    (window as any).mountPanel('imprint');
  });
  const save = page.getByRole('button', { name: 'Save snapshot', exact: true });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByRole('button', { name: 'Load snapshot 1', exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('imprint', JSON.stringify({ text: 'changed', zoom: 3 })));
  await page.getByRole('button', { name: 'Load snapshot 1', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).loaded)).toEqual({ params: { text: 'original' }, view: { zoom: 3 } });
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export snapshots' }).click();
  const download = await downloadEvent;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported).toEqual({ tool: 'imprint', snaps: [{ name: 'snapshot 1', at: expect.any(Number), params: { text: 'original' }, font: null, accent: null }] });
  await page.getByLabel('Import snapshots').setInputFiles({ name: 'import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ tool: 'imprint', snaps: [{ ...exported.snaps[0], params: { text: 'imported' } }] })) });
  await expect(save).toBeEnabled();
  await page.getByRole('button', { name: 'Load snapshot 1', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).loaded.params.text)).toBe('imported');
  await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'invalid.ttf', mimeType: 'font/ttf', buffer: Buffer.from('not a font') });
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(async () => { const a = (window as any).api; return a.typefaces('imprint', a.browserPersistence()).load('primary'); })).toBeNull();
  let fontBytes: Buffer | undefined;
  for (const path of ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf']) {
    try { fontBytes = await readFile(path); break; } catch { /* Try the next platform's installed font. */ }
  }
  if (!fontBytes) throw new Error('Typeface UI test requires an installed Arial or DejaVu Sans TTF');
  for (const slot of ['Primary', 'Accent']) {
    await page.getByLabel(`${slot} typeface`, { exact: true }).setInputFiles({ name: `${slot}.ttf`, mimeType: 'font/ttf', buffer: fontBytes });
    await expect(save).toBeEnabled();
    await expect.poll(() => page.evaluate(slot => (window as any).fontChanges[slot.toLowerCase()]?.file, slot)).toBe(`${slot}.ttf`);
  }
  await page.getByLabel('Snapshot name', { exact: true }).fill('with fonts');
  await save.click();
  await expect(page.getByRole('button', { name: 'Load with fonts', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear primary typeface' }).click();
  await page.getByRole('button', { name: 'Clear accent typeface' }).click();
  await page.getByRole('button', { name: 'Load with fonts', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Object.values((window as any).fontChanges).map((font: any) => font?.file))).toEqual(['Primary.ttf', 'Accent.ttf']);
  await page.getByRole('button', { name: 'Delete with fonts', exact: true }).click();
  await page.getByRole('button', { name: 'Clear accent typeface' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).fontChanges.accent)).toBeNull();
  await page.getByRole('button', { name: 'Delete snapshot 1', exact: true }).click();
  await expect(page.getByText('Nothing saved yet')).toBeVisible();
});
