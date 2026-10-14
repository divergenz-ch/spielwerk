import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let directory: string;
let url: string;
let host: ChildProcess;
const pageErrors = new WeakMap<object, string[]>();
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'spielwerk-controls-'));
  const entry = join(directory, 'entry.js');
  const harness = join(directory, 'ControlsHarness.svelte');
  await writeFile(harness, `
    <script>
      import { untrack } from ${JSON.stringify(resolve('node_modules/svelte/src/index-client.js'))};
      import Controls from ${JSON.stringify(resolve('src/workspace/Controls.svelte'))};
      let { controls, defaults } = $props();
      let params = $state(untrack(() => ({ ...defaults })));
      let expandedGroups = $state(['Geometry', 'Appearance']);
      window.edits = [];
      window.restoreControls = values => { params = { ...values }; };
    </script>
    <Controls {controls} {params} {defaults} {expandedGroups}
      onchange={(key, value) => { window.edits.push({ key, value }); params = { ...params, [key]: value }; }}
      onexpand={(group, open) => { expandedGroups = open ? [...new Set([...expandedGroups, group])] : expandedGroups.filter(g => g !== group); }} />
  `);
  await writeFile(entry, `
    import { mount, unmount } from ${JSON.stringify(resolve('node_modules/svelte/src/index-client.js'))};
    import App from ${JSON.stringify(resolve('src/workspace/App.svelte'))};
    import ControlsHarness from ${JSON.stringify(harness)};
    import { tools } from ${JSON.stringify(resolve('src/workspace/registry.ts'))};
    import { evaluateFixture } from ${JSON.stringify(resolve('src/engine/client.ts'))};
    window.catalog = tools;
    window.calls = [];
    const fixture = {
      id: 'internal-fixture', name: 'Internal engine fixture', description: 'Not a named design tool', status: 'ready', accent: true, playback: true,
      adapter: {
        id: '__fixture__', defaults: { cellSize: 40, fraction: 0.35, ink: '#112233', text: 'proof', enabled: true, style: 'solid' },
        controls: [
          { key: 'cellSize', label: 'Cell size', group: 'Geometry', type: 'number', min: 10, max: 80, step: 5 },
          { key: 'fraction', label: 'Fraction', group: 'Geometry', type: 'number', min: 0.15, max: 1.15, step: 0.2 },
          { key: 'style', label: 'Style', group: 'Appearance', type: 'choice', options: ['solid', 'outline'] },
          { key: 'ink', label: 'Ink', group: 'Appearance', type: 'color' },
          { key: 'text', label: 'Text', group: 'Appearance', type: 'text' },
          { key: 'enabled', label: 'Enabled', group: 'Appearance', type: 'toggle' },
        ],
        dimensions: { width: { min: 40, max: 400 }, height: { min: 40, max: 300 } },
        capabilities: { responsive: true, motion: false, formats: [] },
        async evaluate(input) {
          window.calls.push(input);
          const frame = await evaluateFixture(input);
          if (window.hold === input.design.params.cellSize) await new Promise(resolve => window.release = resolve);
          window.finished = (window.finished ?? 0) + 1;
          if (window.failEvaluation) throw Error('fixture evaluation failure');
          return frame;
        },
      },
      artboard: { initial: { width: 120, height: 80 }, dimensions: true, presets: ['1:1', '2:3'], swap: true, ratioLock: true, handles: ['n','ne','e','se','s','sw','w','nw'] },
      renderer: { render(frame, target) {
        if (window.failRender) throw Error('fixture renderer failure');
        window.rendered = (window.rendered ?? 0) + 1;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', frame.dimensions.width); svg.setAttribute('height', frame.dimensions.height);
        svg.setAttribute('viewBox', '0 0 ' + frame.dimensions.width + ' ' + frame.dimensions.height);
        for (const rect of frame.scene.rectangles) {
          const node = document.createElementNS(svg.namespaceURI, 'rect');
          for (const [key, value] of Object.entries(rect)) node.setAttribute(key, value);
          svg.append(node);
        }
        target.append(svg);
      }},
    };
    const fixed = { ...fixture, id: 'internal-fixed-fixture', name: 'Internal fixed fixture',
      adapter: { ...fixture.adapter, capabilities: { responsive: false, motion: false, formats: [] } },
      artboard: { ...fixture.artboard, handles: [], presets: [], swap: false, ratioLock: false }
    };
    let app;
    window.start = async (mode = 'fixture', capabilityIndex) => {
      if (app) await unmount(app);
      if (mode === 'controls') {
        app = mount(ControlsHarness, { target: document.body, props: { controls: fixture.adapter.controls, defaults: fixture.adapter.defaults } });
        return;
      }
      let catalog = mode === 'catalog' ? tools : [fixture, fixed];
      if (capabilityIndex !== undefined) catalog = [{ ...fixture, adapter: { ...fixture.adapter, capabilities: tools[capabilityIndex].intendedCapabilities } }];
      app = mount(App, { target: document.body, props: { catalog } });
    };
  `);
  await build({ configFile: false, plugins: [svelte()], resolve: { dedupe: ['svelte'] },
    build: { outDir: join(directory, 'dist'), lib: { entry, formats: ['es'], fileName: 'fixture' } },
  });
  const files = await readdir(join(directory, 'dist'));
  await writeFile(join(directory, 'dist/index.html'), `<!doctype html><title>Internal controls fixture</title><link rel="stylesheet" href="./fixture.css"><script type="module" src="./${files.find(f => f.endsWith('.js'))}"></script>`);
  host = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', join(directory, 'dist')], { stdio: ['ignore', 'pipe', 'pipe'] });
  host.stderr!.resume();
  url = await new Promise<string>((resolve, reject) => {
    let output = '';
    host.once('error', reject); host.once('exit', code => reject(new Error(`Host exited ${code}`)));
    host.stdout!.on('data', chunk => { output += chunk; const port = output.match(/port (\d+)/)?.[1]; if (port) resolve(`http://127.0.0.1:${port}/`); });
  });
});
test.afterAll(async () => {
  if (host?.pid && host.exitCode === null) { const exited = once(host, 'exit'); host.kill(); await exited; }
  if (directory) await rm(directory, { recursive: true, force: true });
});
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => (window as any).start);
});

test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]); });

async function edit(page: import('@playwright/test').Page, name: string, value: string) {
  const input = page.getByRole('spinbutton', { name, exact: true });
  await input.fill(value); await input.press('Tab');
}
const scene = (page: import('@playwright/test').Page) => page.getByTestId('scene');

test('catalog navigation and grouped controls use registered metadata, reset, ranges and tool-local saved state', async ({ page }) => {
  await page.evaluate(() => { location.hash = 'unknown'; return (window as any).start('catalog'); });
  await expect(page.getByRole('combobox', { name: 'Tool', exact: true })).toHaveValue('arrow-maze');
  const catalog = await page.evaluate(() => (window as any).catalog);
  expect(catalog).toHaveLength(10);
  for (const tool of catalog) {
    await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption(tool.id);
    await expect(page.getByRole('heading', { name: tool.name, exact: true })).toBeVisible();
    await expect(page.getByText(tool.description, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: `Link to ${tool.name}` })).toHaveAttribute('href', `#${tool.id}`);
    await expect(page.getByText('Design tools are not available yet.', { exact: false })).toBeVisible();
  }
  await page.evaluate(() => { location.hash = 'internal-fixture'; return (window as any).start(); });
  await expect(scene(page).locator('rect')).toHaveCount(6);
  await edit(page, 'Cell size exact', '999');
  await expect(page.getByRole('slider', { name: 'Cell size', exact: true })).toHaveValue('80');
  await edit(page, 'Cell size exact', '-9');
  await expect(page.getByRole('slider', { name: 'Cell size', exact: true })).toHaveValue('10');
  await edit(page, 'Cell size exact', '43');
  await expect(page.getByRole('slider', { name: 'Cell size', exact: true })).toHaveValue('45');
  await page.getByRole('button', { name: 'Reset Cell size' }).click();
  await expect(scene(page).locator('rect')).toHaveCount(6);
  const slider = page.getByRole('slider', { name: 'Cell size', exact: true });
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('45');
  await slider.dblclick();
  await expect(slider).toHaveValue('40');
  await page.getByLabel('Style', { exact: true }).selectOption('outline');
  await page.getByLabel('Text', { exact: true }).fill('changed');
  await page.getByLabel('Enabled', { exact: true }).uncheck();
  await page.getByLabel('Ink', { exact: true }).fill('#abcdef');
  await expect.poll(() => page.evaluate(() => (window as any).calls.at(-1).design.params)).toMatchObject({ cellSize: 40, style: 'outline', text: 'changed', enabled: false, ink: '#abcdef' });
  await page.getByLabel('Zoom', { exact: true }).selectOption('200');
  await page.getByText('Appearance', { exact: true }).click();
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load snapshot 1', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Tool', exact: true }).selectOption('internal-fixed-fixture');
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('proof');
  await expect(page.getByLabel('Layout', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Resize artboard/ })).toHaveCount(0);
  await page.evaluate(() => { location.hash = 'internal-fixture'; });
  await expect(page.getByLabel('Zoom', { exact: true })).toHaveValue('200');
  await expect(page.locator('details').filter({ has: page.getByText('Appearance', { exact: true }) })).not.toHaveAttribute('open');
  await page.getByText('Appearance', { exact: true }).click();
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('changed');
  await page.getByLabel('Text', { exact: true }).fill('later');
  await page.locator('summary').filter({ hasText: /^Snapshots$/ }).click();
  await page.getByRole('button', { name: 'Load snapshot 1', exact: true }).click();
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('changed');
  await expect(page.getByLabel('Zoom', { exact: true })).toHaveValue('200');
});

test('artboard dimensions, presets, ratio, handles and observed responsive relayout stay separate from view', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  await page.getByLabel('Aspect', { exact: true }).selectOption('2:3');
  await expect(scene(page).locator('svg')).toHaveAttribute('height', '180');
  await page.getByRole('button', { name: 'Swap dimensions' }).click();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('180');
  await expect(page.getByLabel('Aspect', { exact: true })).toHaveValue('');
  await page.getByLabel('Lock ratio', { exact: true }).check();
  await edit(page, 'Width', '900');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('400');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('267');
  await page.getByLabel('Lock ratio', { exact: true }).uncheck();
  await edit(page, 'Width', '120'); await edit(page, 'Height', '80');
  await page.getByLabel('Zoom', { exact: true }).selectOption('100');
  for (const [handle, key, axis, expected] of [['e','ArrowRight','Width','121'], ['w','ArrowLeft','Width','122'], ['n','ArrowUp','Height','81'], ['s','ArrowDown','Height','82'], ['ne','ArrowRight','Width','123'], ['se','ArrowRight','Width','124'], ['sw','ArrowLeft','Width','125'], ['nw','ArrowLeft','Width','126']]) {
    await page.getByRole('button', { name: `Resize artboard ${handle}`, exact: true }).press(key);
    await expect(page.getByLabel(axis, { exact: true })).toHaveValue(expected);
  }
  const handle = page.getByRole('button', { name: 'Resize artboard se', exact: true });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 6, box.y + 6); await page.mouse.down(); await page.mouse.move(box.x + 46, box.y + 26); await page.mouse.up();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('166');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('102');
  const resizedBox = (await handle.boundingBox())!;
  await handle.focus();
  await page.mouse.move(resizedBox.x + 6, resizedBox.y + 6); await page.mouse.down();
  await page.mouse.move(resizedBox.x + 26, resizedBox.y + 16);
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('186');
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('166');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('102');
  await expect(page.getByRole('status')).not.toContainText('Updating');
  const before = await page.evaluate(() => (window as any).calls.length);
  const markup = await scene(page).innerHTML();
  await page.getByLabel('Zoom', { exact: true }).selectOption('200');
  const stage = page.getByRole('region', { name: 'Pan preview with Space and drag' });
  const stageBox = (await stage.boundingBox())!;
  await stage.click({ position: { x: 8, y: 8 } });
  await page.keyboard.down('Space');
  await page.mouse.move(stageBox.x + 200, stageBox.y + 200); await page.mouse.down(); await page.mouse.move(stageBox.x + 230, stageBox.y + 220); await page.mouse.up(); await page.keyboard.up('Space');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('internal-fixture')!).pan)).toEqual({ x: 30, y: 20 });
  expect(await scene(page).innerHTML()).toBe(markup);
  expect(await page.evaluate(() => (window as any).calls.length)).toBe(before);
  await page.getByLabel('Layout', { exact: true }).selectOption('responsive');
  await edit(page, 'Container width', '120'); await edit(page, 'Container height', '80');
  await expect(scene(page).locator('rect')).toHaveCount(6);
  await page.getByTestId('preview-container').evaluate(element => { element.style.width = '200px'; });
  await expect(scene(page).locator('rect')).toHaveCount(10);
  await expect(scene(page).locator('rect').first()).toHaveAttribute('width', '20');
  await expect.poll(() => page.evaluate(() => (window as any).calls.at(-1).design.artboard)).toEqual({ mode: 'responsive', dimensions: { width: 200, height: 80 } });
  await edit(page, 'Container width', '999'); await edit(page, 'Container height', '-1');
  await expect(page.getByLabel('Container width', { exact: true })).toHaveValue('400');
  await expect(page.getByLabel('Container height', { exact: true })).toHaveValue('40');
  await page.getByLabel('Layout', { exact: true }).selectOption('fixed');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('166');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('102');
});

test('all eight generator capabilities enable responsive controls; fixed exceptions do not', async ({ page }) => {
  const capabilities = await page.evaluate(() => (window as any).catalog.map((t: any) => ({ id: t.id, responsive: t.intendedCapabilities.responsive })));
  expect(capabilities.filter((t: any) => t.responsive).map((t: any) => t.id).sort()).toEqual(['arrow-maze','arrow-poster','arrow-comb','arrow-field','switchboard','truchet-tiles','imprint','stripe-marquee'].sort());
  expect(capabilities.filter((t: any) => !t.responsive).map((t: any) => t.id)).toEqual(['logo-extruder','font-remixer']);
  for (let index = 0; index < capabilities.length; index++) {
    await page.evaluate(index => (window as any).start('fixture', index), index);
    await expect(scene(page).locator('rect')).toHaveCount(6);
    await expect(page.getByLabel('Layout', { exact: true })).toHaveCount(capabilities[index].responsive ? 1 : 0);
  }
});

test('desktop hierarchy keeps preview dominant and disclosures keyboard reachable without changing design state', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  const saved = await page.evaluate(() => localStorage.getItem('internal-fixture'));
  const markup = await scene(page).innerHTML();
  const artboard = page.locator('summary').filter({ hasText: /^Artboard$/ });
  const snapshots = page.locator('summary').filter({ hasText: /^Snapshots$/ });
  const tabTo = async (target: import('@playwright/test').Locator) => {
    for (let count = 0; count < 80; count++) {
      await page.keyboard.press('Tab');
      if (await target.evaluate(element => element === document.activeElement)) break;
    }
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
  };
  for (const viewport of [{ width: 1280, height: 800 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    const preview = await page.getByRole('region', { name: 'Composition preview', exact: true }).boundingBox();
    const controls = await page.getByRole('complementary', { name: 'Design controls' }).boundingBox();
    expect(preview!.width).toBeGreaterThan(controls!.width * 1.5);
    expect(preview!.y + preview!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await expect(page.getByRole('combobox', { name: 'Tool', exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Internal engine fixture', exact: true })).toBeInViewport();
    await expect(page.getByLabel('Width', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Save snapshot', exact: true })).toBeHidden();
    await page.getByRole('combobox', { name: 'Tool', exact: true }).focus();
    await tabTo(artboard);
    expect(await artboard.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Space');
    await tabTo(page.getByLabel('Layout', { exact: true }));
    await tabTo(page.getByRole('button', { name: 'Swap dimensions', exact: true }));
    await tabTo(snapshots);
    await page.keyboard.press('Enter');
    await tabTo(page.getByLabel('Snapshot name', { exact: true }));
    await tabTo(page.getByRole('button', { name: 'Save snapshot', exact: true }));
    await tabTo(page.getByRole('button', { name: 'Export snapshots', exact: true }));
    await tabTo(page.getByLabel('Import snapshots', { exact: true }));
    await snapshots.press('Space');
    await expect(page.getByRole('button', { name: 'Save snapshot', exact: true })).toBeHidden();
    await tabTo(page.getByLabel('Primary typeface', { exact: true }));
    await tabTo(page.getByRole('button', { name: 'Clear primary typeface' }));
    await tabTo(page.getByLabel('Accent typeface', { exact: true }));
    await tabTo(page.getByRole('button', { name: 'Clear accent typeface' }));
    await artboard.press('Space');
    expect(await page.evaluate(() => localStorage.getItem('internal-fixture'))).toBe(saved);
    expect(await scene(page).innerHTML()).toBe(markup);
  }
});

test('numeric boundaries retain valid values, minimum-relative precision and immediate keyboard steps', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  const fraction = page.getByRole('spinbutton', { name: 'Fraction exact', exact: true });
  for (const [value, expected] of [['0.46', '0.55'], ['-1', '0.15'], ['9', '1.15'], ['0.35', '0.35'], ['', '0.35'], ['1e309', '0.35']]) {
    await fraction.fill(value); await fraction.press('Tab');
    await expect(fraction).toHaveValue(expected);
    await expect.poll(() => page.evaluate(() => (window as any).calls.at(-1).design.params.fraction)).toBe(Number(expected));
  }
  await fraction.press('ArrowUp'); await fraction.press('Tab');
  await expect(fraction).toHaveValue('0.55');
  const slider = page.getByRole('slider', { name: 'Fraction', exact: true });
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('0.75');
  await expect.poll(() => page.evaluate(() => (window as any).calls.at(-1).design.params.fraction)).toBe(0.75);
});

test('Space activates reset and disclosures without panning while text editing keeps its keys', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  await edit(page, 'Cell size exact', '60');
  const reset = page.getByRole('button', { name: 'Reset Cell size', exact: true });
  await page.getByRole('spinbutton', { name: 'Cell size exact', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(reset).toBeFocused();
  expect(await reset.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await reset.press('Space');
  await expect(page.getByRole('spinbutton', { name: 'Cell size exact', exact: true })).toHaveValue('40');
  const summary = page.locator('summary').filter({ hasText: /^Appearance$/ });
  await summary.press('Space');
  await expect(page.getByLabel('Text', { exact: true })).toBeHidden();
  await summary.press('Space');
  const text = page.getByLabel('Text', { exact: true });
  await text.fill('#aabbcc'); await text.press('End'); await text.press('Space');
  await expect(text).toHaveValue('#aabbcc ');
  const stage = page.getByRole('region', { name: 'Pan preview with Space and drag' });
  const box = (await stage.boundingBox())!;
  for (const target of [reset, summary, text]) {
    await target.focus(); await page.keyboard.down('Space');
    await page.mouse.move(box.x + 200, box.y + 200); await page.mouse.down();
    await page.mouse.move(box.x + 230, box.y + 220); await page.mouse.up(); await page.keyboard.up('Space');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('internal-fixture')!).pan)).toBeUndefined();
  }
});

test('restores and repeated mounts do not emit edits; invalid values keep canonical controls', async ({ page }) => {
  for (let mount = 0; mount < 3; mount++) {
    await page.evaluate(() => (window as any).start('controls'));
    await expect(page.getByLabel('Text', { exact: true })).toHaveValue('proof');
    await page.getByText('Appearance', { exact: true }).click();
    await page.evaluate(() => (window as any).restoreControls({ cellSize: 45, fraction: 0.75, text: '#aabbcc', ink: '#abcdef', enabled: false, style: 'outline' }));
    await expect(page.getByLabel('Fraction exact', { exact: true })).toHaveValue('0.75');
    await expect(page.getByLabel('Text', { exact: true })).toBeHidden();
    await page.getByText('Appearance', { exact: true }).click();
    await expect(page.getByLabel('Text', { exact: true })).toHaveValue('#aabbcc');
    await expect(page.getByLabel('Text', { exact: true })).toHaveAttribute('type', 'text');
    await expect(page.getByLabel('Ink', { exact: true })).toHaveValue('#abcdef');
    await expect(page.getByLabel('Enabled', { exact: true })).not.toBeChecked();
    const choice = page.getByLabel('Style', { exact: true });
    await choice.evaluate((element: HTMLSelectElement) => { element.value = 'invalid'; element.dispatchEvent(new Event('change', { bubbles: true })); });
    await expect(choice).toHaveValue('outline');
    await edit(page, 'Cell size exact', '');
    await edit(page, 'Cell size exact', '1e309');
    expect(await page.evaluate(() => (window as any).edits)).toEqual([]);
    await page.getByLabel('Text', { exact: true }).fill('one edit');
    expect(await page.evaluate(() => (window as any).edits)).toEqual([{ key: 'text', value: 'one edit' }]);
  }
});

test('delayed full-detail evaluations coalesce and never publish stale controls or dimensions', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  const original = await scene(page).innerHTML();
  await page.evaluate(() => { (window as any).hold = 20; });
  await edit(page, 'Cell size exact', '20');
  await page.waitForFunction(() => (window as any).release);
  await expect(page.getByTestId('preview-status')).toContainText('Updating full-detail preview — showing previous artwork');
  await edit(page, 'Cell size exact', '10');
  await page.locator('summary').filter({ hasText: /^Artboard$/ }).click();
  await edit(page, 'Width', '200');
  await edit(page, 'Cell size exact', '40');
  expect(await scene(page).innerHTML()).toBe(original);
  await expect(page.getByRole('status')).toContainText('120 × 80');
  await page.evaluate(() => {
    (window as any).counts = [];
    new MutationObserver(() => (window as any).counts.push(document.querySelectorAll('[data-testid=scene] rect').length)).observe(document.querySelector('[data-testid=scene]')!, { childList: true, subtree: true });
    (window as any).release();
  });
  await expect(scene(page).locator('rect')).toHaveCount(10);
  await expect(page.getByRole('status')).toContainText('200 × 80');
  await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  await expect(page.getByTestId('preview-status')).not.toContainText('previous');
  expect(await page.evaluate(() => (window as any).counts)).toEqual([10]);
  const calls = await page.evaluate(() => (window as any).calls);
  expect(calls.slice(-2).map((call: any) => call.design.params.cellSize)).toEqual([20, 40]);
  expect(calls.at(-1).design.params.cellSize).toBe(40);
  expect(calls.at(-1).design.artboard.dimensions).toEqual({ width: 200, height: 80 });
  expect(calls.every((call: any) => !('zoom' in call.design.params) && !('pan' in call.design.params) && call.timeSeconds === 0)).toBe(true);
  const slider = page.getByRole('slider', { name: 'Cell size', exact: true });
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
  await expect(slider).toHaveValue('80');
  await expect.poll(() => page.evaluate(() => (window as any).calls.at(-1).design.params.cellSize)).toBe(80);
  await expect(scene(page).locator('rect')).toHaveCount(3);
  await page.mouse.up();
});

for (const failure of ['failEvaluation', 'failRender']) {
  test(`${failure} retains artwork until a successful current render and navigation disposes pending work`, async ({ page }) => {
    await page.evaluate(() => (window as any).start());
    await expect(scene(page).locator('rect')).toHaveCount(6);
    const original = await scene(page).innerHTML();
    await page.evaluate(failure => { (window as any)[failure] = true; }, failure);
    await edit(page, 'Cell size exact', '20');
    await expect(page.getByRole('alert')).toContainText(failure === 'failEvaluation' ? 'fixture evaluation failure' : 'fixture renderer failure');
    await expect(page.getByTestId('preview-status')).toContainText('Preview failed — showing previous artwork');
    expect(await scene(page).innerHTML()).toBe(original);
    await page.evaluate(failure => { (window as any)[failure] = false; (window as any).hold = 10; }, failure);
    await edit(page, 'Cell size exact', '10');
    await page.waitForFunction(() => (window as any).release);
    await expect(page.getByTestId('preview-status')).toContainText('Updating full-detail preview — showing previous artwork');
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await scene(page).innerHTML()).toBe(original);
    await page.evaluate(() => (window as any).release());
    await expect(scene(page).locator('rect')).toHaveCount(96);
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.evaluate(() => { (window as any).hold = 20; (window as any).release = undefined; });
    await edit(page, 'Cell size exact', '20');
    await page.waitForFunction(() => (window as any).release);
    await page.getByLabel('Tool', { exact: true }).selectOption('internal-fixed-fixture');
    await expect(scene(page).locator('rect')).toHaveCount(6);
    const rendered = await page.evaluate(() => (window as any).rendered);
    const finished = await page.evaluate(() => (window as any).finished);
    await page.evaluate(() => (window as any).release());
    await expect.poll(() => page.evaluate(() => (window as any).finished)).toBe(finished + 1);
    expect(await page.evaluate(() => (window as any).rendered)).toBe(rendered);
    await expect(scene(page).locator('rect')).toHaveCount(6);
    await expect(page.getByTestId('preview-status')).toContainText('Preview current');
  });
}

test('playback renders full detail without frame-by-frame live announcements', async ({ page }) => {
  await page.evaluate(() => (window as any).start());
  await expect(scene(page).locator('rect')).toHaveCount(6);
  await page.getByRole('button', { name: 'Play motion' }).click();
  await expect(page.getByRole('status', { name: 'Preview status' })).toHaveText('Motion playing. Full-detail preview updates continuously.');
  const rendered = await page.evaluate(() => {
    (window as any).announcements = [];
    const live = document.querySelector('[role=status][aria-label="Preview status"]')!;
    new MutationObserver(() => (window as any).announcements.push(live.textContent)).observe(live, { childList: true, characterData: true, subtree: true });
    return (window as any).rendered;
  });
  await expect.poll(() => page.evaluate(() => (window as any).rendered)).toBeGreaterThan(rendered + 10);
  expect(await page.evaluate(() => (window as any).announcements)).toEqual([]);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.getByRole('status', { name: 'Preview status' })).toContainText('Preview current');
  await expect(scene(page).locator('rect')).toHaveCount(6);
});
