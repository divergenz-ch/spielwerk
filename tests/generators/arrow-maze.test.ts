import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = server.resolvedUrls!.local[0] + '#arrow-maze';
});
test.afterAll(async () => { await server?.close(); });

// Authored two-glyph sfnt: ASCII glyphs use a rectangular outline and 700-unit advance.
function fontBytes() {
  const table = (length: number) => new Uint8Array(length);
  const set = (bytes: Uint8Array, at: number, value: number, length = 2) => {
    const view = new DataView(bytes.buffer); if (length === 4) view.setUint32(at, value); else view.setUint16(at, value);
  };
  const head = table(54); set(head, 0, 0x10000, 4); set(head, 12, 0x5f0f3cf5, 4); set(head, 18, 1000); set(head, 36, 0); set(head, 40, 600); set(head, 42, 700); set(head, 46, 8);
  const hhea = table(36); set(hhea, 0, 0x10000, 4); set(hhea, 4, 800); set(hhea, 6, 0xff38); set(hhea, 10, 700); set(hhea, 18, 1); set(hhea, 34, 2);
  const maxp = table(32); set(maxp, 0, 0x10000, 4); set(maxp, 4, 2); set(maxp, 6, 4); set(maxp, 8, 1); set(maxp, 14, 1);
  const hmtx = table(8); set(hmtx, 0, 700); set(hmtx, 4, 700);
  const glyf = table(34); set(glyf, 0, 1); set(glyf, 6, 600); set(glyf, 8, 700); set(glyf, 10, 3); glyf.set([1, 1, 1, 1], 14); [0, 600, 0, -600, 0, 0, 700, 0].forEach((n, i) => set(glyf, 18 + i * 2, n & 65535));
  const loca = table(6); set(loca, 4, 17);
  const cmap = table(234); set(cmap, 2, 1); set(cmap, 4, 3); set(cmap, 6, 1); set(cmap, 8, 12, 4);
  set(cmap, 12, 4); set(cmap, 14, 222); set(cmap, 18, 4); set(cmap, 20, 4); set(cmap, 22, 1);
  set(cmap, 26, 126); set(cmap, 28, 65535); set(cmap, 32, 32); set(cmap, 34, 65535); set(cmap, 38, 1); set(cmap, 40, 4);
  for (let i = 44; i < cmap.length; i += 2) set(cmap, i, 1);
  const post = table(32); set(post, 0, 0x30000, 4);
  const name = table(6); set(name, 4, 6);
  const os2 = table(78); set(os2, 2, 700); set(os2, 4, 400); set(os2, 6, 5); set(os2, 64, 32); set(os2, 66, 126); set(os2, 68, 800); set(os2, 70, 0xff38); set(os2, 74, 800); set(os2, 76, 200);
  const tables: Record<string, Uint8Array> = { 'OS/2': os2, cmap, glyf, head, hhea, hmtx, loca, maxp, name, post };
  let offset = 12 + Object.keys(tables).length * 16;
  const bytes = table(offset + Object.values(tables).reduce((sum, data) => sum + (data.length + 3 & ~3), 0));
  set(bytes, 0, 0x10000, 4); set(bytes, 4, 10); set(bytes, 6, 128); set(bytes, 8, 3); set(bytes, 10, 32);
  Object.entries(tables).forEach(([tag, data], i) => {
    const at = 12 + i * 16; bytes.set(new TextEncoder().encode(tag), at); set(bytes, at + 8, offset, 4); set(bytes, at + 12, data.length, 4); bytes.set(data, offset); offset += data.length + 3 & ~3;
  });
  return bytes;
}

test('real Wasm seeded layout, font geometry, explicit time and responsive boundary', async ({ page }) => {
  await page.goto(url);
  const result = await page.evaluate(async font => {
    const { adapter, artwork } = await import('/src/tools/arrow-maze.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, words: 'Maze | ' + 'W'.repeat(150), fork: 100, motion: 'draw loop' }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 600, height: 400 } }, assets: [] }, timeSeconds: 0.8 };
    const combinations = [];
    for (const style of ['bend', 'arc']) for (const invert of [0, 100]) {
      input.design.params.style = style; input.design.params.invert = invert;
      const first = await adapter.evaluate(input); const repeated = await adapter.evaluate(input);
      combinations.push({ same: JSON.stringify(first) === JSON.stringify(repeated), arrows: first.scene.arrows.length, branches: first.scene.arrows.filter(a => a.parent !== null).length, words: first.scene.words.length, unplaced: first.scene.unplaced.length, inverted: first.scene.panels.every(p => p.inverted === Boolean(invert)), clearance: first.scene.clearance });
    }
    const first = await adapter.evaluate(input);
    input.design.artboard.dimensions.width = 900;
    const resized = await adapter.evaluate(input);
    input.design.assets = [{ id: 'primary', role: 'typeface', mediaType: 'font/ttf', bytes: Uint8Array.from(font) }];
    input.design.params.words = 'Maze';
    const uploaded = await adapter.evaluate(input);
    const svg = await artwork.svg({ frame: uploaded });
    let invalid = '';
    input.design.artboard.dimensions.width = 99;
    try { await adapter.evaluate(input); } catch (e) { invalid = String(e); }
    return { combinations, firstGrid: [first.scene.columns, first.scene.rows], resizedGrid: [resized.scene.columns, resized.scene.rows], fontSvg: await svg.blob.text(), invalid, fontWords: uploaded.scene.words.length };
  }, [...fontBytes()]);
  for (const c of result.combinations) {
    expect(c.same).toBe(true); expect(c.arrows).toBeGreaterThan(0); expect(c.branches).toBeGreaterThan(0); expect(c.words).toBe(1); expect(c.unplaced).toBe(1); expect(c.inverted).toBe(true); expect(c.clearance).toBeGreaterThan(0);
  }
  expect(result.resizedGrid).not.toEqual(result.firstGrid);
  expect(result.fontWords).toBe(1); expect(result.fontSvg).not.toContain('<text'); expect(result.fontSvg).toMatch(/<path d="M[^\"]+Z"/);
  expect(result.invalid).toContain('Invalid Arrow Maze dimensions or time');
});

test('Arrow Maze user surface: dragging, playback and decoded SVG PNG GIF downloads', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));

  await page.goto(url);
  await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Output format' }).locator('option')).toHaveText(['SVG', 'PNG', 'GIF', 'Website embed (ZIP)']);
  await page.getByLabel('Words', { exact: true }).fill('Maze');
  const word = page.getByTestId('scene').locator('[data-word]');
  await expect(word).toBeVisible();
  const before = await word.boundingBox(); expect(before).not.toBeNull();
  await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
  await page.mouse.down(); await page.mouse.move(before!.x + before!.width / 2 + 80, before!.y + before!.height / 2 + 80, { steps: 4 }); await page.mouse.up();
  await expect.poll(async () => (await word.boundingBox())!.x).toBeGreaterThan(before!.x + 30);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('arrow-maze')!));
  expect(saved.nodes.Maze.x).toBeGreaterThan(0); expect(saved.nodes.Maze.y).toBeGreaterThan(0);
  await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('responsive');
  await page.getByLabel('Container width', { exact: true }).fill('400'); await page.getByLabel('Container width', { exact: true }).press('Tab');
  await page.getByLabel('Container height', { exact: true }).fill('300'); await page.getByLabel('Container height', { exact: true }).press('Tab');
  await expect(page.getByTestId('scene').locator('svg')).toHaveAttribute('viewBox', '0 0 400 300');
  await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'rectangle.ttf', mimeType: 'font/ttf', buffer: Buffer.from(fontBytes()) });
  await expect(page.getByRole('region', { name: 'Snapshots and typefaces' })).toContainText('rectangle.ttf');
  await expect(page.getByTestId('scene').locator('[data-word] text')).toHaveCount(0);
  await expect(page.getByTestId('scene').locator('[data-word] path')).not.toHaveCount(0);
  await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('draw loop');
  await page.getByLabel('Cycle seconds exact', { exact: true }).fill('0.5'); await page.getByLabel('Cycle seconds exact', { exact: true }).press('Tab');
  await page.getByLabel('GIF fps exact', { exact: true }).fill('5'); await page.getByLabel('GIF fps exact', { exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect.poll(async () => page.getByTestId('scene').locator('[data-arrow]').count()).toBeGreaterThan(0);
  const earlier = await page.getByTestId('scene').innerHTML();
  await expect.poll(() => page.getByTestId('scene').innerHTML()).not.toBe(earlier);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  for (const format of ['svg', 'png', 'gif']) {
    await page.getByRole('combobox', { name: 'Output format' }).selectOption(format);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
    const download = await downloadPromise;
    const bytes = await readFile((await download.path())!);
    expect(download.suggestedFilename()).toBe(`arrow-maze.${format}`);
    if (format === 'svg') {
      const svg = bytes.toString(); expect(svg).toContain('viewBox="0 0 400 300"'); expect(svg).not.toMatch(/animate|data-word|data-arrow/); expect(svg).not.toContain('<text'); expect(svg).toContain('<path');
    } else {
      const decoded = await page.evaluate(async ({ bytes, format }) => {
        const decoder = new (window as any).ImageDecoder({ data: Uint8Array.from(bytes), type: `image/${format}` });
        await decoder.tracks.ready;
        const count = decoder.tracks.selectedTrack.frameCount;
        const first = (await decoder.decode({ frameIndex: 0 })).image;
        const canvas = Object.assign(document.createElement('canvas'), { width: first.displayWidth, height: first.displayHeight }); const ctx = canvas.getContext('2d')!;
        ctx.drawImage(first, 0, 0); const a = [...ctx.getImageData(0, 0, canvas.width, canvas.height).data]; first.close();
        let different = false;
        if (count > 1) { const last = (await decoder.decode({ frameIndex: count - 1 })).image; ctx.drawImage(last, 0, 0); const b = ctx.getImageData(0, 0, canvas.width, canvas.height).data; different = a.some((v, i) => v !== b[i]); last.close(); }
        decoder.close(); return { count, width: canvas.width, height: canvas.height, different, colors: new Set(a.filter((_, i) => i % 4 !== 3)).size };
      }, { bytes: [...bytes], format });
      expect(decoded.width).toBe(400); expect(decoded.height).toBe(300); expect(decoded.colors).toBeGreaterThan(1);
      if (format === 'gif') { expect(decoded.count).toBe(3); expect(decoded.different).toBe(true); } else expect(decoded.count).toBe(1);
    }
  }
  expect(errors).toEqual([]);
});

test('Maze optional host cell is Rust-owned and absent input preserves editor layout', async ({ page }) => {
  await page.goto(url);
  const result = await page.evaluate(async () => {
    const { adapter, evaluateMaze } = await import('/src/tools/arrow-maze.ts');
    const design = { toolId:adapter.id, params:{...adapter.defaults,margin:0,wpx:600,hpx:400}, seed:42, artboard:{mode:'responsive',dimensions:{width:600,height:400}}, assets:[] };
    const input={design,timeSeconds:0.75};
    const editor=await adapter.evaluate(input), unchanged=await evaluateMaze(input);
    const fixed=await evaluateMaze(input,40);
    const wide=await evaluateMaze({...input,design:{...design,artboard:{mode:'responsive',dimensions:{width:1000,height:400}}}},40);
    const automatic=await evaluateMaze(input,0);
    return {editor,unchanged,fixed,wide,automatic};
  });
  expect(result.editor).toEqual(result.unchanged);
  expect(result.fixed.scene.cell).toBe(40);expect(result.wide.scene.cell).toBe(40);
  expect([result.fixed.scene.columns,result.wide.scene.columns]).toEqual([15,25]);
  expect(result.automatic.scene.columns).toBe(result.editor.scene.columns);
  expect(result.automatic.scene.rows).toBe(result.editor.scene.rows);
});

test('Arrow Maze has no JavaScript calculation fallback when Wasm is unavailable', async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort());
  await page.goto(url);
  await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i);
  await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
});
