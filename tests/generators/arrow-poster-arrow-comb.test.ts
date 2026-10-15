import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });

for (const tool of ['arrow-poster', 'arrow-comb']) {
  test(`${tool}: real Wasm seeded profiles, explicit time and responsive limits`, async ({ page }) => {
    await page.goto(url + '#' + tool);
    const result = await page.evaluate(async tool => {
      const { adapter } = await import(`/src/tools/${tool}.ts`);
      const input = { design: { toolId: tool, params: { ...adapter.defaults, motion: 'draw loop', timing: 'linear', stagger: 0 }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds: 0.8 };
      const first = await adapter.evaluate(input);
      const repeat = await adapter.evaluate(input);
      input.design.seed = 99; const seeded = await adapter.evaluate(input); input.design.seed = 42;
      input.timeSeconds = 0.1; const early = await adapter.evaluate(input);
      input.timeSeconds = 0.8; input.design.artboard.dimensions.width = 600; const wide = await adapter.evaluate(input);
      const profiles = [];
      if (tool === 'arrow-comb') for (const profile of ['fan', 'wave', 'swirl']) { input.design.params.profile = profile; profiles.push((await adapter.evaluate(input)).scene.arrows[0].points); }
      let invalid = ''; input.design.artboard.dimensions.width = 99;
      try { await adapter.evaluate(input); } catch (e) { invalid = String(e); }
      return { same: JSON.stringify(first) === JSON.stringify(repeat), seedChanged: first.scene.svg !== seeded.scene.svg, changedTime: early.scene.svg !== first.scene.svg, wideChanged: wide.scene.arrows[0].points[0][0] !== first.scene.arrows[0].points[0][0], profiles, invalid, motion: first.scene.motionSvg, progress: first.scene.arrows[0].progress };
    }, tool);
    expect(result.same).toBe(true); expect(result.seedChanged).toBe(true); expect(result.changedTime).toBe(true); expect(result.wideChanged).toBe(true);
    expect(result.motion).toContain('<animateMotion'); expect(result.motion).toContain('<animate ');
    expect(result.progress).toBeCloseTo(0.8 / 3 / 0.65);
    expect(result.invalid).toContain('dimensions or time');
    if (tool === 'arrow-comb') expect(new Set(result.profiles.map(p => JSON.stringify(p))).size).toBe(3);
  });

  if (tool === 'arrow-comb') test('arrow-comb: wide short left-only responsive bands still produce visible artwork', async ({ page }) => {
    await page.goto(url + '#' + tool);
    const result = await page.evaluate(async () => {
      const { adapter, artwork } = await import('/src/tools/arrow-comb.ts');
      const frame = await adapter.evaluate({ design: { toolId: adapter.id, params: { ...adapter.defaults, count: 4, nest: 0, dir_up: false, dir_down: false, dir_left: true, dir_right: false, textTop: '', textMid: '', textBot: '', motion: 'none' }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 8000, height: 100 } }, assets: [] }, timeSeconds: 0 });
      const png = await artwork.png!({ frame } as any);
      const image = await createImageBitmap(png.blob);
      const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); image.close();
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      return { arrows: frame.scene.arrows.length, width: canvas.width, height: canvas.height, ink: pixels.some((v, i) => i % 4 !== 3 && v < 100) };
    });
    expect(result.arrows).toBe(4); expect(result.width).toBe(8000); expect(result.height).toBe(100); expect(result.ink).toBe(true);
  });

  test(`${tool}: exported SVG motion matches explicit-time Wasm frames`, async ({ page }) => {
    await page.goto(url + '#' + tool);
    const errors = await page.evaluate(async tool => {
      const { adapter } = await import(`/src/tools/${tool}.ts`);
      document.querySelectorAll('svg').forEach(svg => svg.remove());
      const host = document.createElement('div'); document.body.append(host);
      const errors = [];
      for (const motion of ['draw in', 'draw loop']) for (const timing of ['linear', 'ease out', 'snap']) for (const hold of [0, 35]) {
        const timeSeconds = 1.1;
        const frame = await adapter.evaluate({ design: { toolId: tool, params: { ...adapter.defaults, motion, timing, hold, stagger: 50 }, seed: 42, artboard: { mode: 'fixed', dimensions: { width: 400, height: 300 } }, assets: [] }, timeSeconds });
        const matrices = () => [...host.querySelectorAll('[data-arrow]')].map(group => {
          const matrix = (group.lastElementChild as SVGGraphicsElement).getCTM()!;
          const mask = group.querySelector('mask path')!;
          return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, parseFloat(getComputedStyle(mask).strokeDashoffset)];
        });
        host.innerHTML = frame.scene.motionSvg;
        const svg = host.querySelector('svg')!; svg.pauseAnimations(); svg.setCurrentTime(timeSeconds);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const animated = matrices();
        host.innerHTML = frame.scene.svg;
        const baked = matrices();
        const delta = Math.max(...animated.flatMap((matrix, i) => matrix.map((n, j) => Math.abs(n - baked[i][j]))));
        if (delta > 0.2) errors.push({ motion, timing, hold, delta });
      }
      host.remove(); return errors;
    }, tool);
    expect(errors).toEqual([]);
  });

  test(`${tool}: legacy pixel settings and selections migrate once without losing saved values`, async ({ page }) => {
    await page.addInitScript(tool => {
      localStorage.setItem(tool, JSON.stringify({ seed: 77, wpx: 600, hpx: 800, ...(tool === 'arrow-poster' ? { cwidth: 4, kinds: ['block'] } : { textpx: 72, dirs: ['left'] }), retained: 'sentinel' }));
    }, tool);
    await page.goto(url + '#' + tool);
    await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toBeVisible();
    const stored = await page.evaluate(tool => JSON.parse(localStorage.getItem(tool)!), tool);
    expect(stored.rel).toBe(1); expect(stored.seed).toBe(77); expect(stored.retained).toBe('sentinel');
    if (tool === 'arrow-poster') {
      expect(stored.cwidth).toBeCloseTo(0.67); await expect(page.getByLabel('Use block', { exact: true })).toBeChecked(); await expect(page.getByLabel('Use hook', { exact: true })).not.toBeChecked();
      await expect(page.getByTestId('scene').locator('[data-arrow]:not([data-profile="block"])')).toHaveCount(0);
      await page.getByLabel('Use hook', { exact: true }).locator('..').click();
      await expect(page.getByLabel('Use hook', { exact: true })).toBeChecked();
      await expect(page.getByTestId('scene').locator('[data-profile="hook"]')).not.toHaveCount(0);
    } else {
      expect(stored.textpx).toBe(12); await expect(page.getByLabel('From left', { exact: true })).toBeChecked(); await expect(page.getByLabel('From up', { exact: true })).not.toBeChecked();
    }
    const again = await page.evaluate(async ({ tool, stored }) => {
      const entry = await import(`/src/tools/${tool}.ts`);
      return (tool === 'arrow-poster' ? entry.arrowPoster : entry.arrowComb).prepareSettings(stored);
    }, { tool, stored });
    expect(again).toEqual(stored);
  });

  test(`${tool}: no JavaScript engine fallback when Wasm fails`, async ({ page }) => {
    await page.route('**/*.wasm', route => route.abort());
    await page.goto(url + '#' + tool);
    await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i);
    await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
  });

  test(`${tool}: Svelte controls, playback and decoded responsive artwork`, async ({ page }) => {
    test.setTimeout(90000);
    const consoleErrors: string[] = [];
    page.on('pageerror', error => consoleErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(url + '#' + tool);
    await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toBeVisible();
    await page.screenshot({ path: `.flow/tmp/${tool}-workspace.png`, fullPage: true });
    await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('responsive');
    for (const [label, value] of [['Container width', '400'], ['Container height', '300']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
    await expect(page.getByTestId('scene').locator('svg')).toHaveAttribute('viewBox', '0 0 400 300');
    if (tool === 'arrow-poster') {
      await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('none');
      const chosen = await page.evaluate(() => {
        const svg = document.querySelector('[data-testid="scene"] svg') as SVGSVGElement;
        for (const path of svg.querySelectorAll('[data-arrow] path')) {
          const p = path as SVGPathElement, box = p.getBBox();
          const point = svg.createSVGPoint(); point.x = box.x + box.width / 2; point.y = box.y + box.height / 2;
          const screen = point.matrixTransform(p.getScreenCTM()!);
          const target = document.elementFromPoint(screen.x, screen.y)?.closest('[data-arrow]');
          if (target && target !== svg.querySelector('[data-arrow]:last-child')) return { x: screen.x, y: screen.y, key: target.getAttribute('data-arrow') };
        }
        throw new Error('No lower arrow hit found');
      });
      await page.mouse.click(chosen.x, chosen.y);
      await expect(page.getByTestId('scene').locator('[data-arrow]').last()).toHaveAttribute('data-arrow', chosen.key!);
      const order = await page.evaluate(() => localStorage.getItem('arrow-poster'));
      const outside = await page.evaluate(() => {
        const svg = document.querySelector('[data-testid="scene"] svg')!;
        const rect = svg.getBoundingClientRect();
        for (let y = 15; y < rect.height - 15; y += 15) for (let x = 15; x < rect.width - 15; x += 15) {
          const target = document.elementFromPoint(rect.x + x, rect.y + y);
          if (target === svg.querySelector('rect')) return { x: rect.x + x, y: rect.y + y };
        }
        throw new Error('No background target found');
      });
      await page.mouse.click(outside.x, outside.y);
      expect(await page.evaluate(() => localStorage.getItem('arrow-poster'))).toBe(order);
    } else {
      for (const profile of ['fan', 'wave', 'swirl']) { await page.getByRole('combobox', { name: 'Comb profile', exact: true }).selectOption(profile); await expect(page.getByTestId('scene').locator('[data-arrow]').first()).toHaveAttribute('data-profile', profile); }
      await page.getByLabel('Top row', { exact: true }).fill('Font row');
      const bytes = await readFile('tests/generators/fixtures/outline.ttf');
      await page.getByLabel('Primary typeface', { exact: true }).setInputFiles({ name: 'outline.ttf', mimeType: 'font/ttf', buffer: bytes });
      await expect(page.getByTestId('scene').locator('[data-text] path')).not.toHaveCount(0);
      await expect(page.getByTestId('scene').locator('[data-text] text')).toHaveCount(0);
    }
    await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('draw loop');
    for (const [label, value] of [['Cycle seconds exact', '0.5'], ['GIF fps exact', '5']]) { await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab'); }
    await page.getByRole('button', { name: 'Play motion', exact: true }).click();
    const earlier = await page.getByTestId('scene').innerHTML(); await expect.poll(() => page.getByTestId('scene').innerHTML()).not.toBe(earlier);
    await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
    for (const format of ['svg', 'png', 'gif']) {
      await page.getByRole('combobox', { name: 'Output format' }).selectOption(format);
      const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export artwork', exact: true }).click();
      const download = await pending; const bytes = await readFile((await download.path())!);
      expect(download.suggestedFilename()).toBe(`${tool}.${format}`);
      if (format === 'svg') { const svg = bytes.toString(); expect(svg).toContain('viewBox="0 0 400 300"'); expect(svg).toContain('<animateMotion'); expect(svg).not.toContain('data-arrow'); if (tool === 'arrow-comb') expect(svg).not.toContain('<text'); }
      else {
        const decoded = await page.evaluate(async ({ bytes, format }) => {
          const decoder = new (window as any).ImageDecoder({ data: Uint8Array.from(bytes), type: `image/${format}` }); await decoder.tracks.ready;
          const count = decoder.tracks.selectedTrack.frameCount; const first = (await decoder.decode({ frameIndex: 0 })).image;
          const canvas = Object.assign(document.createElement('canvas'), { width: first.displayWidth, height: first.displayHeight }); const ctx = canvas.getContext('2d')!; ctx.drawImage(first, 0, 0); const a = [...ctx.getImageData(0, 0, canvas.width, canvas.height).data]; first.close();
          let different = false; if (count > 1) { const last = (await decoder.decode({ frameIndex: count - 1 })).image; ctx.drawImage(last, 0, 0); const b = ctx.getImageData(0, 0, canvas.width, canvas.height).data; different = a.some((v, i) => v !== b[i]); last.close(); }
          decoder.close(); return { count, width: canvas.width, height: canvas.height, different, colors: new Set(a).size };
        }, { bytes: [...bytes], format });
        expect(decoded.width).toBe(400); expect(decoded.height).toBe(300); expect(decoded.colors).toBeGreaterThan(2); expect(decoded.count).toBe(format === 'gif' ? 3 : 1); if (format === 'gif') expect(decoded.different).toBe(true);
      }
    }
    expect(consoleErrors).toEqual([]);
  });
}
