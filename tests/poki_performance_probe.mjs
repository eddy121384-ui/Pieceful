// Production cold/warm delivery; explicit QA fixture only for Godot counters
// and repeatable puzzle switching. Does not fabricate live Poki SDK success.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.PIECEFUL_POKI_ORIGIN ?? 'http://127.0.0.1:4294';
const out=process.env.PIECEFUL_POKI_PERF_OUTPUT ?? '/tmp/pieceful-poki-performance.json';
const trials=Number(process.env.PIECEFUL_POKI_PERF_TRIALS ?? 3);
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,
 args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const report={browser:browser.version(),viewport:{width:390,height:844},dpr:1,startup:[],runtime:[],errors:[],
 limits:'Loopback HTTP gzip transfer, CDP 20 Mbps/40 ms. Not Poki CDN. Chromium/SwiftShader, not iPhone. Sampled WASM/Godot/JS/process counters are separate scopes, not mobile peak memory. Production SDK URL deliberately aborted because policy blocks it; observable init failure, no success stub.'};
async function instrument(context){await context.addInitScript(()=>{
 window.__POKI_PERF__={};
 for(const name of ['compile','compileStreaming','instantiate','instantiateStreaming']){
  const original=WebAssembly[name];
  WebAssembly[name]=async function(...args){window.__POKI_PERF__[name+'Start']=performance.now();const r=await original.apply(this,args);
   const instance=r instanceof WebAssembly.Instance?r:r.instance;
   if(instance)window.__POKI_WASM_MEMORY__=Object.values(instance.exports).find(x=>x instanceof WebAssembly.Memory);
   window.__POKI_PERF__[name+'End']=performance.now();return r;
  };
 }
 const timer=setInterval(()=>{
  if(window.__PIECEPACE_READY__&&!window.__POKI_PERF__.engineReady)window.__POKI_PERF__.engineReady=performance.now();
  if(window.PiecefulPoki?.snapshot().usable&&!window.__POKI_PERF__.usable)window.__POKI_PERF__.usable=performance.now();
  if(window.__PIECEFUL_PERF_GALLERY_USABLE_MS__&&!window.__POKI_PERF__.gallery)window.__POKI_PERF__.gallery=performance.now();
 },5);
})}
async function ready(p,profile){await p.waitForFunction(profile==='poki'?()=>window.PiecefulPoki?.snapshot().usable:()=>window.__PIECEPACE_READY__,null,{timeout:150000});await p.waitForTimeout(100)}
async function timing(p){return p.evaluate(()=>({marks:window.__POKI_PERF__,navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(x=>x.toJSON()),sdk:window.PiecefulPoki?.snapshot()}))}
async function capture(p,tag,duration=1800){
 const samples=[];const until=Date.now()+duration;
 while(Date.now()<until){samples.push(await p.evaluate(()=>({ux:window.__PIECEFUL_UX_STATE__?.performance,poki:window.__PIECEFUL_POKI_STATE__,wasm:window.__POKI_WASM_MEMORY__?.buffer.byteLength,content:window.__PIECEFUL_UX_STATE__?.content,pieces:window.__PIECEFUL_UX_STATE__?.pieces})));await p.waitForTimeout(250)}
 const cdp=await p.context().newCDPSession(p),heap=await cdp.send('Runtime.getHeapUsage');await cdp.detach();
 const bc=await browser.newBrowserCDPSession(),procs=await bc.send('SystemInfo.getProcessInfo'),rss=[];
 for(const proc of procs.processInfo){try{const s=await fs.readFile(`/proc/${proc.id}/status`,'utf8');rss.push({type:proc.type,rss_bytes:Number(s.match(/^VmRSS:\s+(\d+)/m)?.[1]??0)*1024})}catch{}}
 await bc.detach();report.runtime.push({tag,samples,heap,rss});console.log('RUNTIME',tag,JSON.stringify(samples.at(-1)));
}
async function start(p,id,diff){await p.evaluate(a=>window.piecefulQaRequest('perf_start',...a),[id,diff]);await p.waitForFunction(a=>{const s=window.__PIECEFUL_UX_STATE__;return s?.content===a[0]&&s.difficulty===a[1]&&!s.gallery&&!s.resume_pending},[id,diff],{timeout:90000})}
try{
 if(!process.env.PIECEFUL_POKI_PERF_RUNTIME_ONLY){
 for(const profile of ['baseline','poki'])for(const delivery of ['raw','gzip'])for(let trial=0;trial<trials;trial++){
  const ctx=await browser.newContext({viewport:report.viewport});await instrument(ctx);
  await ctx.route('https://game-cdn.poki.com/**',route=>route.abort('blockedbyclient'));
  const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  const cdp=await ctx.newCDPSession(p);await cdp.send('Network.enable');let transferred=[];const requests={};
  cdp.on('Network.requestWillBeSent',e=>requests[e.requestId]=e.request.url);cdp.on('Network.loadingFinished',e=>transferred.push({url:requests[e.requestId],encodedBytes:e.encodedDataLength}));
  if(delivery==='gzip')await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:2500000,uploadThroughput:1250000});
  await p.goto(`${origin}/${delivery==='gzip'?'gzip/':''}${profile}/`,{waitUntil:'domcontentloaded',timeout:150000});await ready(p,profile);
  report.startup.push({profile,delivery,trial,cache:'cold',measuredNetwork:transferred,...await timing(p)});
  if(trial===0)await p.screenshot({path:out.replace(/\.json$/,`-${profile}-${delivery}.png`)});
  // Same context and HTTP cache; Godot still reinitializes and saved state may
  // change the first screen. State explicitly recorded, not a cold-client win.
  transferred=[];await p.reload({waitUntil:'domcontentloaded',timeout:150000});await ready(p,profile);
  report.startup.push({profile,delivery,trial,cache:'warm',measuredNetwork:transferred,...await timing(p)});
  console.log('STARTUP',profile,delivery,trial,JSON.stringify(report.startup.slice(-2).map(x=>x.marks)));
  await ctx.close();
 }
 }
 const baselineCtx=await browser.newContext({viewport:report.viewport});await instrument(baselineCtx);const baseline=await baselineCtx.newPage();
 await baseline.goto(`${origin}/full-qa/`,{waitUntil:'domcontentloaded'});await baseline.waitForFunction(()=>window.__PIECEFUL_PERF_GALLERY_USABLE_MS__&&typeof window.piecefulQaRequest==='function',null,{timeout:90000});
 report.baselineGalleryUsableQaMs=await baseline.evaluate(()=>window.__PIECEFUL_PERF_GALLERY_USABLE_MS__);await capture(baseline,'full-app-initial-gallery');await baselineCtx.close();
 const ctx=await browser.newContext({viewport:report.viewport});await instrument(ctx);const p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));await p.goto(`${origin}/qa/`,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__?.setup&&!window.__PIECEFUL_UX_STATE__.bootstrapping&&window.__PIECEFUL_POKI_STATE__&&typeof window.piecefulQaRequest==='function',null,{timeout:90000});
 report.firstActionableQaMs=await p.evaluate(()=>window.__PIECEFUL_PERF_GALLERY_USABLE_MS__);
 await capture(p,'featured-setup');
 // First puzzle real Start control, default Easy count is artwork-adaptive 35.
 const clickTime=await p.evaluate(()=>performance.now());const s=await p.evaluate(()=>window.__PIECEFUL_UX_STATE__),c=s.controls.find(x=>x.text==='Start puzzle');const [x,y,w,h]=c.clip;
 await p.mouse.click((x+w/2)*390/s.viewport[0],(y+h/2)*844/s.viewport[1]);
 await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery);
 report.firstPlayableQaMs=await p.evaluate(()=>performance.now());report.startClickToObservedMs=report.firstPlayableQaMs-clickTime;
 for(const [id,diff,count] of [['met_12802','relaxed',40],['met_335112','standard',150],['met_12802','hard',286]]){
  const before=await p.evaluate(()=>performance.now());await start(p,id,diff);const ms=await p.evaluate(b=>performance.now()-b,before);
  assert.equal((await p.evaluate(()=>window.__PIECEFUL_UX_STATE__)).pieces,count);await capture(p,`${count}-pieces`);report.runtime.at(-1).switchObservedMs=ms;
 }
 for(let i=0;i<12;i++){
  const s=await p.evaluate(()=>window.__PIECEFUL_UX_STATE__),c=s.controls.find(x=>x.name==='LoosePieceLayoutButton'),[x,y,w,h]=c.clip;
  await p.mouse.click((x+w/2)*390/s.viewport[0],(y+h/2)*844/s.viewport[1]);
  await p.waitForFunction(()=>window.__PIECEFUL_TRANSITION__?.active);
  await p.waitForFunction(()=>!window.__PIECEFUL_TRANSITION__?.active&&window.__PIECEFUL_UX_STATE__.controls.find(x=>x.name==='LoosePieceLayoutButton')?.disabled===false);await p.waitForTimeout(200);
 }
 await capture(p,'286-after-12-toggles');
 for(const id of ['met_10181','met_359362','met_335112','met_11181','met_394043','met_438031','met_12802','met_312624']){
  await start(p,id,'relaxed');await capture(p,`switch-${id}`,700);await p.evaluate(()=>window.piecefulQaRequest('perf_gallery'));await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery);
 }
 await capture(p,'eight-switches-gallery');
 for(let i=0;i<3;i++){await start(p,'met_10181','relaxed');await p.evaluate(()=>window.piecefulQaRequest('perf_gallery'));await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery)}
 await capture(p,'three-gallery-cycles');await start(p,'met_10181','poki_quick');await p.evaluate(()=>window.piecefulQaRequest('complete'));await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.completion);await capture(p,'completion');
 await ctx.close();assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log('PASS poki_performance_probe');
