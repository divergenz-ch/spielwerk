import { test, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { createServer, type Server } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

let directory: string, appUrl: string, packageUrl: string;
const servers: Server[] = [];
const special = 'A </script><script>window.injected=1</script> & " Ω \\';
const tools = ['arrow-maze', 'arrow-poster', 'arrow-comb', 'arrow-field', 'switchboard', 'truchet-tiles', 'imprint', 'stripe-marquee'];
const textTools = ['arrow-maze', 'arrow-comb', 'switchboard', 'stripe-marquee'];
const mime: Record<string, string> = { html: 'text/html', js: 'text/javascript', wasm: 'application/wasm', css: 'text/css', bin: 'application/octet-stream' };
async function host(root: string) {
  const server = createServer(async (request, response) => {
    try {
      if (request.url === '/favicon.ico') { response.statusCode = 204; response.end(); return; }
      const pathname = decodeURIComponent(new URL(request.url!, 'http://fixture').pathname);
      const path = resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
      if (!path.startsWith(resolve(root) + sep)) throw Error('Outside fixture');
      const bytes = await readFile(path);
      response.setHeader('Content-Type', mime[path.split('.').at(-1)!] ?? 'application/octet-stream');
      response.end(bytes);
    } catch { response.statusCode = 404; response.end('Not found'); }
  });
  servers.push(server);
  await new Promise<void>(ok => server.listen(0, '127.0.0.1', ok));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
}
function extract(bytes: Buffer, path: string) {
  execFileSync('python3', ['-c', 'import sys,zipfile,io; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; z.extractall(sys.argv[1])', path], { input: bytes });
}
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'spielwerk-packages-'));
  await build({ build: { outDir: join(directory, 'app'), assetsInlineLimit: 0, rolldownOptions: { input: 'index.html' } } });
  await mkdir(join(directory, 'packages'));
  appUrl = await host(join(directory, 'app'));
  packageUrl = await host(join(directory, 'packages'));
});
test.afterAll(async () => {
  for (const server of servers) await new Promise<void>((ok, fail) => server.close(error => error ? fail(error) : ok()));
  if (directory) await rm(directory, { recursive: true, force: true });
});
async function open(page: Page, id: string) {
  await page.goto(appUrl + '#' + id);
  await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
  await page.getByLabel('Output format').selectOption('embed');
}
async function download(page: Page) {
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  const file = await waiting;
  await expect(page.getByRole('status', { name: 'Export progress' })).toContainText('browser downloads');
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}
for (const id of tools) test(`${id}: actual workspace ZIP, local fonts, inert inputs, demo and relocated snippet`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && message.location().url !== appUrl + 'snaps/ping') errors.push(`${message.text()} ${message.location().url}`); });
  // Existing settings are the public persisted-input route, including interaction state.
  await page.addInitScript(({ id, special }) => localStorage.setItem(id, JSON.stringify({
    wpx: 600, hpx: 800, rel: 1, words: id === 'arrow-maze' ? 'A|MAZE|' + special : special, textTop: special, text: special, labels: special, fontFamily: special,
    nodes: { A: { x: 0.3, y: 0.3 }, MAZE: { x: 0.6, y: 0.6, acc: true } },
    motion: ['arrow-maze','arrow-poster','arrow-comb'].includes(id) ? 'draw loop' : id === 'arrow-field' ? 'spin' : id === 'imprint' ? 'grow loop' : id === 'switchboard' ? 'flow' : id === 'stripe-marquee' ? 'up' : 'none',
    st: Array(35).fill(1), margin: 0,
  })), { id, special });
  await open(page, id);
  const font = await readFile('tests/generators/fixtures/outline.ttf');
  let accent: Buffer | undefined;
  if (textTools.includes(id)) {
    const fontless = await page.getByTestId('scene').locator('svg').evaluate(svg => svg.outerHTML);
    await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'face </script> & " Ω.ttf', mimeType: 'font/ttf', buffer: font });
    await expect(page.getByText('face </script> & " Ω.ttf', { exact: true })).toBeVisible();
    await expect.poll(async () => (await page.getByTestId('scene').locator('svg').evaluate(svg => svg.outerHTML)) !== fontless, { message: 'Uploaded primary font must change actual SVG geometry' }).toBe(true);
    if (id === 'arrow-maze') {
      for (const candidate of ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf']) {
        try { accent = await readFile(candidate); break; } catch { /* next platform */ }
      }
      expect(accent, 'A distinct browser-loadable accent font is required').toBeDefined();
      const primaryOnly = await page.getByTestId('scene').locator('svg').evaluate(svg => svg.outerHTML);
      await page.getByLabel('Accent typeface', { exact: true }).setInputFiles({ name: 'accent & Ω.ttf', mimeType: 'font/ttf', buffer: accent! });
      await expect.poll(async () => (await page.getByTestId('scene').locator('svg').evaluate(svg => svg.outerHTML)) !== primaryOnly, { message: 'Uploaded accent font must change actual SVG geometry' }).toBe(true);
    }
  }
  await expect(page.getByTestId('scene').locator('svg')).toHaveAttribute('viewBox', '0 0 600 800');
  const expected = await page.getByTestId('scene').locator('svg').evaluate(svg => svg.outerHTML);
  const exported = await download(page);
  expect(exported.name).toBe(`${id}-42-embed.zip`);
  const path = join(directory, 'packages', id);
  extract(exported.bytes, path);
  await writeFile(`.flow/tmp/package-${id}.zip`, exported.bytes);
  const runtime = await readFile(join(path, 'runtime.js'), 'utf8');
  expect(runtime).not.toMatch(/\.svelte|\/src\/|Encoding frame|Export artwork|svelte\/internal/);
  const snippet = await readFile(join(path, 'snippet.html'), 'utf8');
  expect(snippet).not.toContain('<script>window.injected');
  if (textTools.includes(id)) {
    expect(await readFile(join(path, 'fonts/0.bin'))).toEqual(font);
    if (id === 'arrow-maze') expect(await readFile(join(path, 'fonts/1.bin'))).toEqual(accent);
  }
  await mkdir(join(directory, 'packages', 'sites', id), { recursive: true });
  await writeFile(join(directory, 'packages', 'sites', id, 'index.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,">${snippet.replace('src="./runtime.js"', `src="../../${id}/runtime.js"`)}`);
  const routes = [`${id}/index.html`, `sites/${id}/index.html`];
  if (id === 'arrow-maze') {
    const configuration = JSON.parse(snippet.match(/application\/json">([\s\S]*?)<\/script>/)![1]);
    await writeFile(join(path, 'config.json'), JSON.stringify(configuration));
    await writeFile(join(path, 'external.html'), '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><script type="module" src="./runtime.js"></script><spielwerk-artwork config-src="./config.json" style="display:block;width:100%;aspect-ratio:600/800"></spielwerk-artwork>');
    routes.push(`${id}/external.html`);
  }
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  for (const route of routes) {
    await page.goto(packageUrl + route);
    await page.waitForFunction(() => (document.querySelector('spielwerk-artwork') as any)?.frame);
    expect(await page.evaluate(async url => typeof (await import(url)).EmbedRuntime, packageUrl + `${id}/runtime.js`)).toBe('function');
    await page.evaluate(async () => {
      const element = document.querySelector('spielwerk-artwork') as any;
      await element.ready; await element.pause();
      element.style.width = '600px'; element.style.height = '800px';
    });
    await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 600 800');
    const initial = await page.evaluate(async () => {
      const element = document.querySelector('spielwerk-artwork') as any;
      await element.seek(0);
      const svg = document.createElement('div'); svg.innerHTML = element.frame.scene.svg;
      return svg.firstElementChild!.outerHTML;
    });
    expect(initial).toBe(expected);
    expect(await page.evaluate(() => (window as any).injected)).toBeUndefined();
    const config = route.endsWith('external.html')
      ? await (await page.request.get(packageUrl + `${id}/config.json`)).json()
      : await page.locator('spielwerk-artwork > script').evaluate(script => JSON.parse(script.textContent!));
    expect(config.params[textTools.includes(id) ? id === 'arrow-comb' ? 'textTop' : id === 'stripe-marquee' ? 'text' : id === 'switchboard' ? 'labels' : 'words' : 'words']).toBe(id === 'arrow-maze' ? 'A|MAZE|' + special : special);
    expect(config.params.fontFamily).toBe(special);
    expect(config.artboard.dimensions).toEqual({ width: 600, height: 800 });
    const times = await page.evaluate(async () => {
      const element = document.querySelector('spielwerk-artwork') as any;
      return [(await element.seek(0)).scene.svg, (await element.seek(0.37)).scene.svg];
    });
    if (id === 'truchet-tiles') expect(times[0]).toBe(times[1]);
    else expect(times[0]).not.toBe(times[1]);
    await page.evaluate(() => { (document.querySelector('spielwerk-artwork') as HTMLElement).style.width = '800px'; });
    await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 800 800');
    await expect(page.locator('spielwerk-artwork input, spielwerk-artwork button, spielwerk-artwork animate')).toHaveCount(0);
    await page.screenshot({ path: `.flow/tmp/package-${id}-${route.startsWith('sites') ? 'snippet' : route.endsWith('external.html') ? 'external' : 'demo'}.png` });
    if (id !== 'truchet-tiles') {
      await page.evaluate(() => (document.querySelector('spielwerk-artwork') as any).play());
      await expect.poll(() => page.evaluate(() => (document.querySelector('spielwerk-artwork') as any).frame.timeSeconds)).toBeGreaterThan(0.37);
    }
  }
  expect(requests.every(url => url.startsWith(packageUrl))).toBe(true);
  expect(requests.some(url => url.endsWith('.wasm'))).toBe(true);
  if (textTools.includes(id)) expect(requests.some(url => url.endsWith('fonts/0.bin'))).toBe(true);
  expect(errors).toEqual([]);
});

test('two independently fonted packages share a page without sharing their font base', async ({ page }) => {
  const first = await readFile('tests/generators/fixtures/outline.ttf');
  let second: Buffer | undefined;
  for (const candidate of ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf']) {
    try { second = await readFile(candidate); break; } catch { /* next platform */ }
  }
  expect(second, 'Distinct font required for package isolation').toBeDefined();
  const snippets: string[] = [], expected: string[] = [];
  for (const [index, font] of [first, second!].entries()) {
    await open(page, 'stripe-marquee');
    await page.getByLabel('Text', { exact: true }).fill('A');
    await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: `face-${index}.ttf`, mimeType: 'font/ttf', buffer: font });
    await expect(page.getByText(`face-${index}.ttf`, { exact: true })).toBeVisible();
    // Export captures and evaluates the same immutable input at time zero.
    const exported = await download(page);
    const folder = `mixed-${index}`;
    extract(exported.bytes, join(directory, 'packages', folder));
    const snippet = await readFile(join(directory, 'packages', folder, 'snippet.html'), 'utf8');
    snippets.push(snippet.replace('src="./runtime.js"', `src="./${folder}/runtime.js"`));
    await page.goto(packageUrl + `${folder}/index.html`);
    await page.waitForFunction(() => (document.querySelector('spielwerk-artwork') as any)?.frame);
    await page.evaluate(() => { const el = document.querySelector('spielwerk-artwork') as HTMLElement; el.style.width = '600px'; el.style.height = '800px'; });
    await expect(page.locator('spielwerk-artwork svg')).toHaveAttribute('viewBox', '0 0 600 800');
    expected.push(await page.evaluate(async () => { const el = document.querySelector('spielwerk-artwork') as any; await el.pause(); return (await el.seek(0)).scene.svg; }));
  }
  expect(expected[0] === expected[1], 'Distinct outlines must produce distinct geometry').toBe(false);
  await writeFile(join(directory, 'packages', 'mixed.html'), `<!doctype html><meta charset="utf-8">${snippets.join('\n')}`);
  await page.goto(packageUrl + 'mixed.html');
  await page.waitForFunction(() => [...document.querySelectorAll('spielwerk-artwork')].every((el: any) => el.frame));
  await page.evaluate(() => document.querySelectorAll('spielwerk-artwork').forEach((el: HTMLElement) => { el.style.width = '600px'; el.style.height = '800px'; }));
  for (const svg of await page.locator('spielwerk-artwork svg').all()) await expect(svg).toHaveAttribute('viewBox', '0 0 600 800');
  const actual = await page.evaluate(async () => Promise.all([...document.querySelectorAll('spielwerk-artwork')].map(async (el: any) => { await el.pause(); return (await el.seek(0)).scene.svg; })));
  expect(actual.map((svg, index) => svg === expected[index]), 'Each element must retain its own exported font geometry').toEqual([true, true]);
});

test('package progress, immutable design, runtime fetch failure and recovery through workspace downloads', async ({ page }) => {
  await open(page, 'arrow-maze');
  let release!: () => void;
  const held = new Promise<void>(ok => { release = ok; });
  await page.route('**/runtime-*.js', async route => { await held; await route.continue(); });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Export progress' })).toHaveText('Collecting embed runtime and fonts…');
  await expect(page.getByRole('button', { name: 'Export artwork', exact: true })).toBeDisabled();
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  await page.getByLabel('Width', { exact: true }).fill('700');
  await page.getByLabel('Width', { exact: true }).press('Tab');
  release();
  const file = await pending;
  const path = join(directory, 'immutable'); extract(await readFile((await file.path())!), path);
  expect(await readFile(join(path, 'snippet.html'), 'utf8')).toContain('"dimensions":{"width":600,"height":800}');
  await page.unroute('**/runtime-*.js');
  await page.route('**/runtime-*.js', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Export failed: Error: Embed asset unavailable: runtime.js (503)');
  await expect(page.getByRole('button', { name: 'Export artwork', exact: true })).toBeEnabled();
  await page.unroute('**/runtime-*.js');
  expect((await download(page)).name).toBe('arrow-maze-42-embed.zip');
});

test('actual package folder write, retained destination on cancel, and denied-write download fallback', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).writes = [];
    (window as any).showDirectoryPicker = async () => {
      if ((window as any).cancel) throw new DOMException('cancelled', 'AbortError');
      return { name: 'Package folder', async getFileHandle(name: string) {
        if ((window as any).denyWrite) throw new DOMException('permission revoked', 'NotAllowedError');
        return { async createWritable() { return { async write(blob: Blob) { (window as any).writes.push({ name, bytes: [...new Uint8Array(await blob.arrayBuffer())] }); }, async close() { (window as any).writeClosed = true; } }; } };
      } };
    };
  });
  await open(page, 'arrow-maze');
  const pick = page.getByRole('button', { name: 'Choose export folder' });
  await pick.click();
  await page.evaluate(() => { (window as any).cancel = true; });
  await pick.click();
  await expect(page.getByText('Destination: Package folder', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Export progress' })).toContainText('Package folder');
  const writes = await page.evaluate(() => ({ writes: (window as any).writes, closed: (window as any).writeClosed }));
  expect(writes.closed).toBe(true); expect(writes.writes).toHaveLength(1);
  const path = join(directory, 'folder'); extract(Buffer.from(writes.writes[0].bytes), path);
  expect(await readFile(join(path, 'runtime.js'), 'utf8')).toContain('spielwerk-artwork');
  await page.evaluate(() => { (window as any).denyWrite = true; });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
  const downloaded = await pending;
  expect(await readFile((await downloaded.path())!)).toEqual(Buffer.from(writes.writes[0].bytes));
  await expect(page.getByRole('alert')).toContainText('Folder output failed:');
  await expect(page.getByRole('alert')).toContainText('Used browser download instead.');
  for (const id of ['logo-extruder', 'font-remixer']) {
    await page.getByRole('navigation', { name: 'Tools' }).getByRole('combobox').selectOption(id);
    await expect(page.getByLabel('Output format')).toHaveCount(0);
  }
});
