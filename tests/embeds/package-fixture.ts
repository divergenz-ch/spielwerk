import { test as base, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { createServer, type Server } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

export const tools = ['arrow-maze', 'arrow-poster', 'arrow-comb', 'arrow-field', 'switchboard', 'truchet-tiles', 'imprint', 'stripe-marquee'];
const textTools = ['arrow-maze', 'arrow-comb', 'switchboard', 'stripe-marquee'];
type Packages = { origins: string[] };
export const test = base.extend<{}, { packages: Packages }>({
  packages: [async ({ browser }, use) => {
    const directory = await mkdtemp(join(tmpdir(), 'spielwerk-final-hosts-'));
    const servers: Server[] = [];
    const mime: Record<string, string> = { html: 'text/html; charset=utf-8', js: 'text/javascript', wasm: 'application/wasm', css: 'text/css' };
    async function host(root: string) {
      const server = createServer(async (request, response) => {
        try {
          if (request.url === '/favicon.ico' || request.url === '/snaps/ping') { response.statusCode = 204; response.end(); return; }
          const pathname = decodeURIComponent(new URL(request.url!, 'http://fixture').pathname);
          const path = resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
          if (!path.startsWith(resolve(root) + sep)) throw Error('Outside fixture');
          response.setHeader('Content-Type', mime[path.split('.').at(-1)!] ?? 'application/octet-stream');
          response.end(await readFile(path));
        } catch { response.statusCode = 404; response.end('Not found'); }
      });
      servers.push(server);
      await new Promise<void>(ok => server.listen(0, '127.0.0.1', ok));
      return `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
    }
    const page = await browser.newPage();
    try {
      await build({ build: { outDir: join(directory, 'app'), assetsInlineLimit: 0, rolldownOptions: { input: 'index.html' } } });
      const app = await host(join(directory, 'app'));
      const root = join(directory, 'packages');
      await mkdir(root);
      const font = await readFile('tests/generators/fixtures/outline.ttf');
      for (const id of tools) {
        await page.goto(app);
        await page.evaluate(id => {
          localStorage.setItem(id, JSON.stringify({ wpx: 600, hpx: 800, rel: 1, margin: 0,
            motion: ['arrow-maze', 'arrow-poster', 'arrow-comb'].includes(id) ? 'draw loop' : id === 'arrow-field' ? 'spin' : id === 'imprint' ? 'grow loop' : id === 'switchboard' ? 'flow' : id === 'stripe-marquee' ? 'up' : 'none',
            speed: 0.5, secs: 1, hold: 0, stagger: 0, st: Array(35).fill(1),
          }));
        }, id);
        await page.goto(app + '#' + id);
        await page.reload();
        await expect(page.getByTestId('scene').locator('svg')).toBeVisible();
        if (textTools.includes(id)) {
          await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'original.ttf', mimeType: 'font/ttf', buffer: font });
          await expect(page.getByText('original.ttf', { exact: true })).toBeVisible();
        }
        await page.getByLabel('Output format').selectOption('embed');
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
        const download = await pending;
        const bytes = await readFile((await download.path())!);
        const path = join(root, 'nested', id);
        execFileSync('python3', ['-c', 'import sys,zipfile,io; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; z.extractall(sys.argv[1])', path], { input: bytes });
        await writeFile(`.flow/tmp/final-host-${id}.zip`, bytes);
        const snippet = await readFile(join(path, 'snippet.html'), 'utf8');
        // Host CSS, not the demo's viewport height, owns the independent box.
        await writeFile(join(path, 'host.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><style>body{margin:0}spielwerk-artwork{width:400px!important;height:300px}</style>${snippet}`);
      }
      await page.close();
      await use({ origins: [await host(root), await host(root)] });
    } finally {
      if (!page.isClosed()) await page.close();
      for (const server of servers) {
        server.closeAllConnections();
        await new Promise<void>((ok, fail) => server.close(error => error ? fail(error) : ok()));
      }
      await rm(directory, { recursive: true, force: true });
    }
  }, { scope: 'worker', timeout: 60_000 }],
});
export { expect };
export async function openPackage(page: Page, origin: string, id: string, attributes: Record<string, string> = {}) {
  await page.goto(`${origin}nested/${id}/host.html`);
  await page.waitForFunction(() => (document.querySelector('spielwerk-artwork') as any)?.frame);
  // Options are connection-time attributes. Reconnect the real exported element,
  // rather than constructing a source runtime or mocking its browser observers.
  await page.evaluate(async attributes => {
    const old = document.querySelector('spielwerk-artwork')!;
    const element = old.cloneNode(true) as any;
    element.querySelectorAll('div').forEach((node: Element) => node.remove());
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    old.replaceWith(element); await element.ready;
  }, attributes);
}
export async function state(page: Page) {
  return page.evaluate(() => {
    const element = document.querySelector('spielwerk-artwork') as any;
    const { timeSeconds, durationSeconds, dimensions, scene } = element.frame;
    return { timeSeconds, durationSeconds, dimensions, svg: scene.svg };
  });
}
export async function seek(page: Page, seconds: number) {
  await page.evaluate(async seconds => { const el = document.querySelector('spielwerk-artwork') as any; await el.pause(); await el.seek(seconds); }, seconds);
  return state(page);
}
export async function command(page: Page, name: 'play' | 'pause' | 'restart') {
  await page.evaluate(async name => { await (document.querySelector('spielwerk-artwork') as any)[name](); }, name);
}
export async function offscreen(page: Page, on: boolean) {
  await page.evaluate(on => { (document.querySelector('spielwerk-artwork') as HTMLElement).style.marginTop = on ? '2000px' : '0px'; }, on);
  await expect.poll(() => page.locator('spielwerk-artwork').evaluate(el => el.getBoundingClientRect().top)).toBe(on ? 2000 : 0);
  await page.waitForTimeout(100); // Let the actual IntersectionObserver deliver.
}
