import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = process.env.PIECEFUL_PERF_ORIGIN ?? 'http://127.0.0.1:4290';
const label = process.env.PIECEFUL_PERF_LABEL ?? 'before';
const output = process.env.PIECEFUL_PERF_OUTPUT ?? `/tmp/pieceful-perf-${label}.json`;
const trials = Number(process.env.PIECEFUL_PERF_TRIALS ?? 3);
// Compression is precomputed before the server listens. Health-check outside
// the measured navigation so service startup cannot skew cold-client timing.
for(let attempt=0;attempt<60;attempt++) {
  try {const response=await fetch(`${origin}/perf-${label}/`);if(response.ok)break;} catch {}
  if(attempt===59) throw new Error('Local benchmark server did not become ready');
  await new Promise(resolve=>setTimeout(resolve,500));
}
const browser = await chromium.launch({headless:true, executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,
  args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const result = {label, browser:browser.version(), viewport:{width:390,height:844}, dpr:1, cold:[], runtime:[], errors:[],
  limits:'Local Chromium/SwiftShader, not Safari/mobile hardware. Godot static/texture monitors and JS heap are scoped counters, not whole-browser peak memory. Gzip transfer is measured on this local server, not a CDN.'};

async function capture(page, tag, duration=2500) {
  const samples = [];
  const until = Date.now()+duration;
  while(Date.now()<until) {
    const state=await page.evaluate(()=>({...window.__PIECEFUL_UX_STATE__, wasmLinearBytes:window.__PIECEFUL_WASM_MEMORY__?.buffer.byteLength ?? null}));
    state.performance.wasm_linear_bytes=state.wasmLinearBytes;
    samples.push(state);
    await page.waitForTimeout(250);
  }
  const cdp = await page.context().newCDPSession(page);
  const heap = await cdp.send('Runtime.getHeapUsage');
  await cdp.detach();
  const browserCdp=await browser.newBrowserCDPSession();
  const processes=await browserCdp.send('SystemInfo.getProcessInfo');
  const processRss=[];
  for(const p of processes.processInfo) {
    try {
      const status=await fs.readFile(`/proc/${p.id}/status`,'utf8');
      processRss.push({type:p.type,rss_bytes:Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0)*1024});
    } catch { /* Process may exit between enumeration and sampling. */ }
  }
  await browserCdp.detach();
  const last = samples.at(-1);
  const row = {tag, content:last.content, pieces:last.pieces, solved:last.solved,
    samples:samples.map(s=>s.performance), jsHeap:heap, processRss};
  result.runtime.push(row);
  console.log('SAMPLE',tag,JSON.stringify(row.samples.at(-1)));
  return last;
}
async function click(page, name, text) {
  const s = await page.evaluate(()=>window.__PIECEFUL_UX_STATE__);
  const control = s.controls.find(c=>!c.disabled && (name ? c.name===name : c.text===text));
  assert(control, `Visible control ${name ?? text}`);
  const [x,y,w,h]=control.clip;
  assert(w>0 && h>0,'Control visible');
  await page.mouse.click((x+w/2)*390/s.viewport[0],(y+h/2)*844/s.viewport[1]);
}
async function start(page, id, difficulty) {
  const began = await page.evaluate(()=>performance.now());
  await page.evaluate(args=>window.piecefulQaRequest('perf_start',...args),[id,difficulty]);
  await page.waitForFunction(args=>{const s=window.__PIECEFUL_UX_STATE__;return s && !s.gallery && s.content===args[0] && s.difficulty===args[1] && !s.resume_pending},[id,difficulty],{timeout:60000});
  return await page.evaluate(b=>performance.now()-b,began);
}
try {
  if(process.env.PIECEFUL_PERF_RUNTIME_ONLY || process.env.PIECEFUL_PERF_PHOTO_ONLY || process.env.PIECEFUL_PERF_MAX_ONLY) {
    const previous=JSON.parse(await fs.readFile(output,'utf8'));
    result.cold=previous.cold;
    if(process.env.PIECEFUL_PERF_PHOTO_ONLY || process.env.PIECEFUL_PERF_MAX_ONLY) Object.assign(result,previous);
  }
  // Production bytes and loader timing use the real shipping main scene.
  for(const profile of process.env.PIECEFUL_PERF_RUNTIME_ONLY || process.env.PIECEFUL_PERF_PHOTO_ONLY || process.env.PIECEFUL_PERF_MAX_ONLY ? [] : ['raw-loopback','gzip-20Mbps-40ms']) for(let trial=0;trial<trials;trial++) {
    const context = await browser.newContext({viewport:result.viewport});
    const page = await context.newPage();
    page.on('pageerror',e=>result.errors.push(e.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    if(profile.startsWith('gzip')) await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:2500000,uploadThroughput:1250000});
    await page.addInitScript(()=>{
      window.__PERF_MARKS__={};
      for(const name of ['compile','compileStreaming','instantiate','instantiateStreaming']) {
        const original=WebAssembly[name];
        WebAssembly[name]=async function(...args){
          const marks=window.__PERF_MARKS__;
          marks[`${name}Start`]=performance.now();
          const r=await original.apply(this,args);
          const instance=r instanceof WebAssembly.Instance ? r : r.instance;
          if(instance) window.__PIECEFUL_WASM_MEMORY__=Object.values(instance.exports).find(v=>v instanceof WebAssembly.Memory);
          marks[`${name}End`]=performance.now();
          return r;
        };
      }
      const timer=setInterval(()=>{if(window.__PIECEPACE_READY__){window.__PERF_MARKS__.engineReady=performance.now();clearInterval(timer)}},5);
    });
    await page.goto(`${origin}/${profile.startsWith('gzip')?'gzip/':''}perf-${label}/`,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.__PIECEPACE_READY__,null,{timeout:120000});
    await page.waitForTimeout(250);
    const timing=await page.evaluate(()=>({marks:window.__PERF_MARKS__,navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(x=>x.toJSON())}));
    result.cold.push({profile,trial,...timing});
    if(trial===0) await page.screenshot({path:output.replace(/\.json$/,`-${profile}.png`)});
    console.log('COLD',profile,trial,JSON.stringify(timing.marks));
    await context.close();
  }
  // Separate, non-shipping fixture adds Godot counters and lifecycle commands.
  const context=await browser.newContext({viewport:result.viewport});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    const original=WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming=async function(...args) {
      const result=await original.apply(this,args);
      window.__PIECEFUL_WASM_MEMORY__=Object.values(result.instance.exports).find(v=>v instanceof WebAssembly.Memory);
      return result;
    };
  });
  page.on('pageerror',e=>result.errors.push(e.message));
  await page.goto(`${origin}/perf-${label}-qa/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__?.gallery && !window.__PIECEFUL_UX_STATE__.bootstrapping,null,{timeout:60000});
  if(process.env.PIECEFUL_PERF_MAX_ONLY) {
    await page.waitForFunction(()=>typeof window.piecefulQaRequest==='function');
    await start(page,'met_359362','hard');
    assert.equal((await page.evaluate(()=>window.__PIECEFUL_UX_STATE__)).pieces,300,'Actual current catalog maximum, beyond the nominal 286 fixture');
    await capture(page,'catalog-maximum-300',4000);
  } else if(process.env.PIECEFUL_PERF_PHOTO_ONLY) {
    await page.waitForFunction(()=>typeof window.piecefulQaRequest==='function');
    const assetRoot=process.env.PIECEFUL_REPO_ROOT ?? '/workspace/Pieceful';
    for(const id of ['met_898372','met_54393']) {
      const bytes=await fs.readFile(`${assetRoot}/assets/museum/met_v0/puzzles/${id}.jpg`);
      await page.evaluate(base64=>window.piecefulQaRequest('perf_photo',base64),bytes.toString('base64'));
      await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.pending.startsWith('photo_'));
      const photoId=(await page.evaluate(()=>window.__PIECEFUL_UX_STATE__)).pending;
      await start(page,photoId,'relaxed');
      await capture(page,`large-photo-${id}`);
      await page.evaluate(()=>window.piecefulQaRequest('perf_gallery'));
      await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery);
    }
    await capture(page,'two-large-photos-gallery');
    await start(page,'met_10181','relaxed');
    await capture(page,'after-two-large-photo-switch');
  } else {
  result.galleryUsableObservedMs=await page.evaluate(()=>performance.now());
  result.galleryUsableFrameMarkerMs=await page.evaluate(()=>window.__PIECEFUL_PERF_GALLERY_USABLE_MS__ ?? null);
  await capture(page,'initial-gallery');
  await click(page,'Artwork_garden');
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.setup);
  const began=await page.evaluate(()=>performance.now());
  await click(page,null,'Start puzzle');
  await page.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.pieces===40);
  result.firstPuzzleStartClickToObservedMs=await page.evaluate(b=>performance.now()-b,began);
  result.firstPuzzlePlayableObservedMs=await page.evaluate(()=>performance.now());
  await capture(page,'40-pieces');
  for(const difficulty of ['standard','hard']) {
    const ms=await start(page,'garden',difficulty);
    result.runtime.push({tag:`start-${difficulty}`,observedMs:ms});
    await capture(page,`${difficulty}-pieces`);
  }
  for(let i=0;i<12;i++) {
    await click(page,'LoosePieceLayoutButton');
    await page.waitForFunction(()=>!window.__PIECEFUL_TRANSITION__?.active && window.__PIECEFUL_UX_STATE__?.controls.find(c=>c.name==='LoosePieceLayoutButton')?.disabled===false);
    await page.waitForTimeout(300);
  }
  await capture(page,'286-after-12-rail-scatter');
  const catalog=JSON.parse(await fs.readFile(process.env.PIECEFUL_PERF_CATALOG ?? '/workspace/Pieceful/content/catalog_v1.json','utf8')).contents;
  const ids=catalog.filter(c=>c.source_id.startsWith('met:')).slice(0,8).map(c=>c.id);
  for(const id of ids) {
    const ms=await start(page,id,'relaxed');
    await capture(page,`switch-${id}`,1000);
    result.runtime.at(-1).startObservedMs=ms;
    await page.evaluate(()=>window.piecefulQaRequest('perf_gallery'));
    await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery);
  }
  await capture(page,'eight-artwork-gallery');
  for(let i=0;i<3;i++) {await start(page,ids[0],'relaxed');await page.evaluate(()=>window.piecefulQaRequest('perf_gallery'));await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery)}
  await capture(page,'repeated-gallery-game-gallery');
  const photo=await fs.readFile(process.env.PIECEFUL_TEST_PHOTO ?? '/workspace/Pieceful/tests/fixtures/product-ux-photo.png');
  await page.evaluate(base64=>window.piecefulQaRequest('perf_photo',base64),photo.toString('base64'));
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.pending.startsWith('photo_'));
  const photoId=(await page.evaluate(()=>window.__PIECEFUL_UX_STATE__)).pending;
  await start(page,photoId,'relaxed');
  await capture(page,'photo-game');
  await start(page,ids[0],'relaxed');
  await capture(page,'after-photo-switch');
  await page.evaluate(()=>window.piecefulQaRequest('complete'));
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.completion);
  await capture(page,'completion');
  await click(page,'CompletionTimelapseReplay');
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.replay);
  await capture(page,'replay');
  const close=(await page.evaluate(()=>window.__PIECEFUL_UX_STATE__)).replay_close;
  await click(page,close);
  await capture(page,'after-replay');
  }
  await context.close();
  assert.deepEqual(result.errors,[]);
} finally {
  await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
  await browser.close();
}
console.log('PASS web_performance_probe',output);
