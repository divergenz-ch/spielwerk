import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { readFile } from 'node:fs/promises';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => { server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); await server.listen(); url = server.resolvedUrls!.local[0]; });
test.afterAll(async () => { await server?.close(); });

// Authored outline fixture: replace its rectangle with an A contour and counter.
async function letterFont() {
  const base = await readFile('tests/generators/fixtures/outline.ttf');
  const points = [[0,0],[250,700],[350,700],[600,0],[460,0],[410,180],[190,180],[140,0], [240,320],[360,320],[300,510]];
  const glyph = Buffer.alloc(10 + 4 + 2 + points.length + points.length * 4);
  glyph.writeInt16BE(2,0); glyph.writeInt16BE(600,6); glyph.writeInt16BE(700,8);
  glyph.writeUInt16BE(7,10); glyph.writeUInt16BE(10,12);
  glyph.fill(1,16,16+points.length);
  let offset = 16+points.length;
  for (let axis=0; axis<2; axis++) { let prev=0; for (const point of points) { glyph.writeInt16BE(point[axis]-prev,offset); offset+=2; prev=point[axis]; } }
  const tables: { tag: string; bytes: Buffer }[] = [];
  for (let i=0;i<base.readUInt16BE(4);i++) {
    const at=12+i*16, tag=base.toString('ascii',at,at+4);
    let bytes=Buffer.from(base.subarray(base.readUInt32BE(at+8),base.readUInt32BE(at+8)+base.readUInt32BE(at+12)));
    if (tag==='glyf') bytes=Buffer.concat([glyph,Buffer.alloc(glyph.length%2)]);
    if (tag==='loca') { bytes.writeUInt16BE(0,0); bytes.writeUInt16BE(0,2); bytes.writeUInt16BE(Math.ceil(glyph.length/2),4); }
    tables.push({tag,bytes});
  }
  const result=Buffer.alloc(12+tables.length*16+tables.reduce((n,t)=>n+Math.ceil(t.bytes.length/4)*4,0));
  base.copy(result,0,0,12); let at=12+tables.length*16;
  tables.forEach((t,i)=>{ const record=12+i*16; result.write(t.tag,record); result.writeUInt32BE(at,record+8); result.writeUInt32BE(t.bytes.length,record+12);t.bytes.copy(result,at);at+=Math.ceil(t.bytes.length/4)*4; });
  return result;
}

test('Stripe: uploaded outlines carry lettering, column/shear/direction controls, repeatable times and relayout', async ({ page }) => {
  await page.goto(url+'#stripe-marquee');
  const font = await letterFont();
  const result = await page.evaluate(async bytes => {
    const { adapter, stripeMarquee } = await import('/src/tools/stripe-marquee.ts');
    const input = { design: { toolId: adapter.id, params: { ...adapter.defaults, text: 'A', fontsize: 20, fit: 'free', lineh: 110, gapx: 40, rowgap: 0, rows: 40, depth: 5, motion: 'up', secs: 1 }, seed: 42, artboard: { mode: 'responsive', dimensions: { width: 400, height: 300 } }, assets: [{ id:'face', role:'typeface', mediaType:'font/ttf', bytes:Uint8Array.from(bytes) }] }, timeSeconds: 0.2 };
    const first=await adapter.evaluate(input), repeat=await adapter.evaluate(input);
    const changed=[];
    for (const [key,value] of Object.entries({ text:'', depth:3, skew:-20, xscale:150, rowphase:15, rowlag:10 })) changed.push((await adapter.evaluate({...input,design:{...input.design,params:{...input.design.params,[key]:value}}})).scene.svg);
    const directions=[]; for (const motion of ['up','down','left','right','none']) directions.push(await adapter.evaluate({...input,design:{...input.design,params:{...input.design.params,motion}}}));
    const loop=await adapter.evaluate({...input,timeSeconds:1.2});
    const wide=await adapter.evaluate({...input,design:{...input.design,artboard:{mode:'responsive',dimensions:{width:800,height:300}}}});
    const doubled=await adapter.evaluate({...input,design:{...input.design,artboard:{mode:'fixed',dimensions:{width:800,height:600}}}});
    const invalid=[];
    for (const size of [99,8001]) {try {await adapter.evaluate({...input,design:{...input.design,artboard:{mode:'fixed',dimensions:{width:size,height:300}}}});invalid.push(false);} catch {invalid.push(true);} }
    const migrated=stripeMarquee.prepareSettings!({wpx:1500,fontsize:300,minw:4,seed:77,retained:'sentinel'});
    const lettering=await adapter.evaluate({...input,design:{...input.design,params:{...input.design.params,fontsize:25,rows:110,depth:6,jitter:0,minw:0.01,skew:0,motion:'none',ink0:0,ink1:100,contrast:100},artboard:{mode:'fixed',dimensions:{width:400,height:440}}}});
    const polygons=new DOMParser().parseFromString(lettering.scene.svg,'image/svg+xml').querySelectorAll('polygon');
    const cellWidth=(row:number,col:number)=>{const points=polygons[row*64+col].getAttribute('points')!.split(' ').map(p=>p.split(',').map(Number));return points[1][0]-points[0][0];};
    const silhouette={stem:cellWidth(17,3),counter:cellWidth(17,4),paper:cellWidth(17,12)};
    return { first,repeat,changed,directions,loop,wide,doubled,invalid,migrated,silhouette,twice:stripeMarquee.prepareSettings!(migrated) };
  }, [...font]);
  expect(result.first).toEqual(result.repeat); expect(result.first.scene.svg).toBe(result.loop.scene.svg);
  for (const changed of result.changed) expect(changed).not.toBe(result.first.scene.svg);
  expect(new Set(result.directions.map(f=>f.scene.svg)).size).toBe(5); expect(result.directions[4].durationSeconds).toBe(0);
  expect(result.wide.scene.tile[0]).toBeCloseTo(result.first.scene.tile[0]*2);
  expect(result.doubled.scene.tile[1]).toBeCloseTo(result.first.scene.tile[1]*2);
  expect(result.wide.scene.svg).not.toBe(result.first.scene.svg); expect(result.invalid).toEqual([true,true]);
  expect(result.migrated).toEqual(result.twice); expect(result.migrated).toMatchObject({rel:1,fontsize:20,minw:4/1500*100,seed:77,retained:'sentinel'});
  expect(result.first.scene.svg).not.toMatch(/<text|<clipPath|<image|font-family/);
  const widths=[...result.first.scene.svg.matchAll(/points="([\d.-]+),[\d.-]+ ([\d.-]+),/g)].map(m=>+m[2]-+m[1]);
  expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths)*1.2);
  expect(result.silhouette.stem).toBeGreaterThan(5); expect(result.silhouette.counter).toBeLessThan(3); expect(result.silhouette.paper).toBe(0);
});

test('Stripe: real UI font upload, legacy snapshot migration, playback and decoded SVG/PNG/GIF exports', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('stripe-marquee',JSON.stringify({wpx:1500,hpx:2000,fontsize:300,minw:4,seed:77})));
  await page.goto(url+'#stripe-marquee');
  await expect(page.getByTestId('scene').locator('polygon').first()).toBeVisible();
  await expect(page.getByLabel('Font size % of artboard width exact',{exact:true})).toHaveValue('20');
  const legacy={wpx:1500,hpx:2000,fontsize:300,minw:4,seed:77};
  await page.getByLabel('Import snapshots',{exact:true}).setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({tool:'stripe-marquee',snaps:[{name:'legacy stripe',at:1,params:legacy,font:null,accent:null}]}))});
  for(let i=0;i<2;i++) {const load=page.getByRole('button',{name:'Load legacy stripe',exact:true}); await load.click(); await expect(load).toBeEnabled(); await expect(page.getByLabel('Font size % of artboard width exact',{exact:true})).toHaveValue('20');}
  await page.getByRole('combobox',{name:'Layout',exact:true}).selectOption('responsive');
  for(const [label,value] of [['Container width','400'],['Container height','300']]) {await page.getByLabel(label,{exact:true}).fill(value);await page.getByLabel(label,{exact:true}).press('Tab');}
  await page.getByLabel('Text',{exact:true}).fill('A');
  await page.getByLabel('Primary typeface',{exact:true}).setInputFiles({name:'letter-a.ttf',mimeType:'font/ttf',buffer:await letterFont()});
  await expect(page.getByText('letter-a.ttf',{exact:true})).toBeVisible();
  for(const [label,value] of [['Cycle seconds exact','1'],['GIF fps exact','5'],['Column depth exact','5']]) {await page.getByLabel(label,{exact:true}).fill(value);await page.getByLabel(label,{exact:true}).press('Tab');}
  await expect(page.getByTestId('scene').locator('svg')).toHaveAttribute('viewBox','0 0 400 300');
  await page.screenshot({path:'.flow/tmp/stripe-marquee-workspace.png',fullPage:true});
  await page.getByRole('button',{name:'Play motion',exact:true}).click();const early=await page.getByTestId('scene').innerHTML();await expect.poll(()=>page.getByTestId('scene').innerHTML()).not.toBe(early);await page.getByRole('button',{name:'Pause motion',exact:true}).click();
  for(const format of ['svg','png','gif']) {
    await page.getByRole('combobox',{name:'Output format'}).selectOption(format);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export artwork',exact:true}).click();const download=await pending;const bytes=await readFile((await download.path())!);
    expect(download.suggestedFilename()).toBe(`stripe-marquee.${format}`);
    if(format==='svg') {expect(bytes.toString()).toContain('viewBox="0 0 400 300"');expect(bytes.toString()).toContain('<polygon');expect(bytes.toString()).not.toMatch(/<text|<image|<clipPath/);}
    else {
      const decoded=await page.evaluate(async ({bytes,format})=>{
        const decoder=new (window as any).ImageDecoder({data:Uint8Array.from(bytes),type:`image/${format}`});await decoder.tracks.ready;const count=decoder.tracks.selectedTrack.frameCount;const first=(await decoder.decode({frameIndex:0})).image;
        const canvas=Object.assign(document.createElement('canvas'),{width:first.displayWidth,height:first.displayHeight});const ctx=canvas.getContext('2d')!;ctx.drawImage(first,0,0);first.close();const a=[...ctx.getImageData(0,0,canvas.width,canvas.height).data];let different=false;
        if(count>1){const last=(await decoder.decode({frameIndex:count-1})).image;ctx.drawImage(last,0,0);last.close();const b=ctx.getImageData(0,0,canvas.width,canvas.height).data;different=a.some((v,i)=>v!==b[i]);}
        decoder.close();return{count,width:canvas.width,height:canvas.height,different,colors:new Set(a).size};
      },{bytes:[...bytes],format});
      expect(decoded.width).toBe(400);expect(decoded.height).toBe(300);expect(decoded.colors).toBeGreaterThan(2);expect(decoded.count).toBe(format==='gif'?5:1);if(format==='gif')expect(decoded.different).toBe(true);
    }
  }
  await page.reload();await expect(page.getByTestId('scene').locator('polygon').first()).toBeVisible();await expect(page.getByLabel('Font size % of artboard width exact',{exact:true})).toHaveValue('20');
  await expect(page.getByText('letter-a.ttf',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Stripe: Wasm failure has no JavaScript geometry fallback',async({page})=>{
  await page.route('**/*.wasm',route=>route.abort());await page.goto(url+'#stripe-marquee');await expect(page.getByRole('alert')).toContainText(/Error|fetch|WebAssembly/i);await expect(page.getByTestId('scene').locator('svg')).toHaveCount(0);
});
