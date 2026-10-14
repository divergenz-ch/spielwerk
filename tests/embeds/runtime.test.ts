import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [{ name:'embed-host', configureServer(server) {
    server.middlewares.use('/embed-host', (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><body style="margin:0"><div id="art" style="width:400px;height:300px"></div></body></html>');
    });
  } }] });
  await server.listen(); url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

const tools = ['arrow-maze', 'arrow-poster', 'arrow-comb', 'arrow-field', 'switchboard', 'truchet-tiles', 'imprint', 'stripe-marquee'];
for (const id of tools) test(`${id}: real independent host, fonts, explicit seek and responsive full visual frame`, async ({ page }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(r.url()));
  await page.goto(url + 'embed-host');
  const bytes = [...await readFile('tests/generators/fixtures/outline.ttf')];
  const result = await page.evaluate(async ({ id, bytes }) => {
    const { EmbedRuntime, adapters } = await import('/src/embeds/runtime.ts');
    const { evaluateMaze } = await import('/src/tools/arrow-maze.ts');
    const adapter = adapters[id];
    const params = { ...adapter.defaults, ...(id === 'arrow-maze' ? { words:'MAZE', motion:'draw loop', margin:0 } : id === 'arrow-poster' || id === 'arrow-comb' ? { motion:'draw loop' } : id === 'switchboard' ? {st:Array(35).fill(1)} : {}) };
    const design = { toolId:id, params, seed:42, artboard:{ mode:'responsive', dimensions:{width:600,height:800} }, assets:[{id:'face',role:'typeface',mediaType:'font/ttf',bytes:Uint8Array.from(bytes)},{id:'accent',role:'accent-typeface',mediaType:'font/ttf',bytes:Uint8Array.from(bytes)}] };
    const runtime = new EmbedRuntime(document.getElementById('art')!, design, {playback:'loop'});
    (window as any).runtime = runtime;
    (window as any).embedDesign = design;
    await new Promise<void>(resolve => document.getElementById('art')!.addEventListener('spielwerk:frame', () => resolve(), {once:true}));
    await runtime.pause();
    const first = await runtime.seek(0.37); const repeated = await runtime.seek(0.37);
    const input = {design:{...design,artboard:{mode:'responsive',dimensions:{width:400,height:300}}},timeSeconds:0.37};
    const expected = id === 'arrow-maze' ? await evaluateMaze(input,0) : await adapter.evaluate(input);
    const fontless = id === 'arrow-maze' ? await evaluateMaze({...input,design:{...input.design,assets:[]}},0) : await adapter.evaluate({...input,design:{...input.design,assets:[]}});
    return { first, repeated, expected, fontChanges:fontless.scene.svg !== expected.scene.svg };
  }, { id, bytes });
  expect(result.first).toEqual(result.repeated);
  expect(result.first).toEqual(result.expected);
  expect(result.first.scene.svg.length).toBeGreaterThan(300);
  if (['arrow-maze','arrow-comb','switchboard','stripe-marquee'].includes(id)) expect(result.fontChanges).toBe(true);
  await expect(page.locator('#art svg')).toHaveAttribute('viewBox','0 0 400 300');
  await expect(page.locator('#art animate, #art animateTransform, #art animateMotion, #art input, #art button, #art textarea')).toHaveCount(0);
  // Visitor pointer/widget/drag input cannot change the delivered design or frame.
  const before = await page.locator('#art svg').evaluate(svg => svg.outerHTML);
  await page.mouse.move(120,120); await page.mouse.down(); await page.mouse.move(200,180); await page.mouse.up();
  expect(await page.locator('#art svg').evaluate(svg => svg.outerHTML)).toBe(before);
  await page.evaluate(() => { document.getElementById('art')!.style.width='800px'; });
  await expect(page.locator('#art svg')).toHaveAttribute('viewBox','0 0 800 300');
  const resized = await page.evaluate(async () => {
    const runtime=(window as any).runtime; await runtime.pause(); return runtime.seek(0.37);
  });
  expect(resized.dimensions).toEqual({width:800,height:300});
  expect(resized.scene.svg).not.toBe(result.first.scene.svg);
  const still = await page.evaluate(async () => { const r=(window as any).runtime; return [await r.seek(0),await r.seek(0.73)]; });
  if(id==='truchet-tiles') { expect(still[0].scene.svg).toBe(still[1].scene.svg); expect(still[0].durationSeconds).toBe(0); }
  else expect(still[0].scene.svg).not.toBe(still[1].scene.svg);
  await page.screenshot({path:`.flow/tmp/embed-${id}.png`});
  await page.evaluate(() => (window as any).runtime.play());
  if (id !== 'truchet-tiles') {
    await expect.poll(() => page.evaluate(() => (window as any).runtime.frame.timeSeconds)).toBeGreaterThan(0.73);
  }
  await page.evaluate(() => { document.getElementById('art')!.style.marginTop='2000px'; });
  await page.waitForTimeout(100);
  const offscreen = await page.evaluate(() => (window as any).runtime.frame.timeSeconds);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).runtime.frame.timeSeconds)).toBe(offscreen);
  await page.evaluate(() => { document.getElementById('art')!.style.marginTop='0px'; });
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(() => page.evaluate(() => (window as any).runtime.frame.durationSeconds)).toBe(0);
  const reduced = await page.locator('#art svg').evaluate(svg => svg.outerHTML);
  await page.waitForTimeout(100);expect(await page.locator('#art svg').evaluate(svg => svg.outerHTML)).toBe(reduced);
  await page.emulateMedia({reducedMotion:'no-preference'});
  // A completed once-mode host remains at the adapter's end time, even after play.
  const final = await page.evaluate(async () => {
    const {EmbedRuntime}=await import('/src/embeds/runtime.ts');
    const old=(window as any).runtime; old.destroy();
    const r=new EmbedRuntime(document.getElementById('art')!,(window as any).embedDesign,{playback:'once'});
    (window as any).runtime=r;
    await new Promise<void>(ok=>document.getElementById('art')!.addEventListener('spielwerk:frame',()=>ok(),{once:true}));
    await r.pause();const duration=r.frame!.durationSeconds;await r.seek(duration);await r.play();return duration;
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).runtime.frame.timeSeconds)).toBe(final);
  expect(requests.some(r => /\.svelte|\/src\/workspace\//.test(r))).toBe(false);
  expect(requests.some(r => r.endsWith('.wasm'))).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(() => (window as any).runtime.destroy());
  await expect(page.locator('#art svg')).toHaveCount(0);
});

test('Maze fit modes, fixed-cell relayout, inherited proportions and config replacement', async ({ page }) => {
  await page.goto(url+'embed-host');
  const result=await page.evaluate(async () => {
    const { EmbedRuntime, adapters }=await import('/src/embeds/runtime.ts');
    const design={toolId:'arrow-maze',params:{...adapters['arrow-maze'].defaults,wpx:600,hpx:400,margin:0},seed:42,artboard:{mode:'responsive',dimensions:{width:600,height:400}},assets:[]};
    const results=[];
    for(const fit of ['regenerate','contain','cover','fixed']) {
      const host=document.getElementById('art')!;
      host.style.width='400px';host.style.height='300px';
      const r=new EmbedRuntime(host,design,{fit,playback:'static',cell:40});
      await new Promise<void>(ok=>host.addEventListener('spielwerk:frame',()=>ok(),{once:true}));
      const first=r.frame;const svg=host.firstElementChild!.shadowRoot!.querySelector('svg')!;
      const map={aspect:svg.getAttribute('preserveAspectRatio'),width:svg.style.width,height:svg.style.height};
      host.style.width='800px';
      await new Promise<void>(ok=>host.addEventListener('spielwerk:frame',()=>ok(),{once:true}));
      results.push({fit,first,last:r.frame,map});r.destroy();
    }
    const host=document.getElementById('art')!;host.style.width='600px';host.style.height='';
    const r=new EmbedRuntime(host,design,{playback:'static',cell:40});
    await new Promise<void>(ok=>host.addEventListener('spielwerk:frame',()=>ok(),{once:true}));
    const auto=r.frame;const ratio=host.style.aspectRatio;
    await r.setConfig({...design,params:{...design.params,wpx:400,hpx:800},artboard:{mode:'responsive',dimensions:{width:400,height:800}}});
    await new Promise<void>(ok=>host.addEventListener('spielwerk:frame',()=>ok(),{once:true}));
    const replaced=r.frame;r.destroy();return{results,auto,ratio,replaced};
  });
  for(const item of result.results) {
    if(item.fit==='regenerate') {
      expect(item.first.dimensions).toEqual({width:400,height:300});expect(item.last.dimensions).toEqual({width:800,height:300});
      expect(item.first.scene.columns).toBe(10);expect(item.last.scene.columns).toBe(20);
      // As in the prototype, the requested cell selects rounded grid counts; leftover space is centred.
      expect(item.first.scene.cell).toBeCloseTo(37.5);expect(item.last.scene.cell).toBeCloseTo(37.5);
    } else {
      expect(item.first.dimensions).toEqual({width:600,height:400});expect(item.last.scene).toEqual(item.first.scene);
      expect(item.map.aspect).toBe(item.fit==='cover'?'xMidYMid slice':'xMidYMid meet');
      expect(item.map.width).toBe(item.fit==='fixed'?'600px':'100%');
      expect(item.map.height).toBe(item.fit==='fixed'?'400px':'100%');
    }
  }
  expect(result.auto.dimensions).toEqual({width:600,height:400});expect(result.ratio).toBe('600 / 400');
  expect(result.replaced.dimensions).toEqual({width:600,height:1200});
});

test('Maze host clock: once completion, play/pause/restart/seek, in-view, offscreen and reduced-motion transitions', async ({page})=>{
  await page.goto(url+'embed-host');
  await page.evaluate(async()=>{
    const {EmbedRuntime,adapters}=await import('/src/embeds/runtime.ts');
    const design={toolId:'arrow-maze',params:{...adapters['arrow-maze'].defaults,motion:'draw loop',speed:0.5,hold:0,stagger:0},seed:42,artboard:{mode:'responsive',dimensions:{width:600,height:800}},assets:[]};
    (window as any).design=design;
    (window as any).runtime=new EmbedRuntime(document.getElementById('art')!,design,{playback:'once'});
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame?.timeSeconds)).toBe(1);
  const completed=await page.locator('#art svg').evaluate(svg=>svg.outerHTML); await page.waitForTimeout(150);expect(await page.locator('#art svg').evaluate(svg=>svg.outerHTML)).toBe(completed);
  await page.evaluate(async()=>{const r=(window as any).runtime;await r.pause();await r.restart();await r.seek(0.2);});
  expect(await page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBe(0.2);
  await page.evaluate(()=>(window as any).runtime.play());
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBeGreaterThan(0.2);
  await page.evaluate(()=>(window as any).runtime.pause());
  const paused=await page.evaluate(()=>(window as any).runtime.frame.timeSeconds);
  await page.waitForTimeout(100);expect(await page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBe(paused);
  await page.evaluate(async()=>{
    const {EmbedRuntime}=await import('/src/embeds/runtime.ts');(window as any).runtime.destroy();
    (window as any).runtime=new EmbedRuntime(document.getElementById('art')!,(window as any).design,{playback:'in-view'});
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame?.timeSeconds)).toBeGreaterThan(0.1);
  await page.evaluate(()=>document.getElementById('art')!.style.marginTop='2000px');
  await page.waitForTimeout(100);
  const offscreen=await page.evaluate(()=>(window as any).runtime.frame.timeSeconds);
  await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBe(offscreen);
  await page.evaluate(()=>document.getElementById('art')!.style.marginTop='0px');
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBeLessThan(offscreen);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame.durationSeconds)).toBe(0);
  const reduced=await page.locator('#art svg').evaluate(svg=>svg.outerHTML);await page.waitForTimeout(100);expect(await page.locator('#art svg').evaluate(svg=>svg.outerHTML)).toBe(reduced);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame.durationSeconds)).toBe(1);
  await page.evaluate(async()=>{
    const {EmbedRuntime}=await import('/src/embeds/runtime.ts');(window as any).runtime.destroy();
    (window as any).runtime=new EmbedRuntime(document.getElementById('art')!,(window as any).design,{playback:'loop',pauseOffscreen:false,reducedMotion:'ignore'});
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame?.durationSeconds)).toBe(0.5);
  await page.evaluate(()=>document.getElementById('art')!.style.marginTop='2000px');
  const override=await page.evaluate(()=>(window as any).runtime.frame.timeSeconds);
  await expect.poll(()=>page.evaluate(()=>(window as any).runtime.frame.timeSeconds)).toBeGreaterThan(override+0.1);
  await page.evaluate(()=>(window as any).runtime.destroy());
});
