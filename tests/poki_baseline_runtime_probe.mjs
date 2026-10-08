// Companion Full-App control, fresh browser, same museum/counts as Poki probe.
// Explicit QA build only; first puzzle uses actual rendered controls.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.PIECEFUL_POKI_ORIGIN ?? 'http://127.0.0.1:4294';
const output=process.env.PIECEFUL_POKI_BASELINE_OUTPUT ?? '/tmp/pieceful-full-runtime-control.json';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const report={scope:'Full-App explicit QA, raw loopback, fresh Chromium/SwiftShader at 390x844 DPR1. Not shipping-probe timing or physical-device peak.',runtime:[],errors:[]};
const c=await browser.newContext({viewport:{width:390,height:844}});
await c.addInitScript(()=>{for(const name of ['instantiate','instantiateStreaming']){const original=WebAssembly[name];WebAssembly[name]=async function(...args){const result=await original.apply(this,args),i=result instanceof WebAssembly.Instance?result:result.instance;if(i)window.__CONTROL_WASM_MEMORY__=Object.values(i.exports).find(x=>x instanceof WebAssembly.Memory);return result}}});
const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
const state=()=>p.evaluate(()=>window.__PIECEFUL_UX_STATE__);
async function click(match){await p.waitForFunction(m=>window.__PIECEFUL_UX_STATE__.controls.some(c=>!c.disabled&&(m.name?c.name===m.name:c.text.startsWith(m.prefix))),match);const s=await state(),cs=s.controls.filter(c=>!c.disabled&&(match.name?c.name===match.name:c.text.startsWith(match.prefix)));assert.equal(cs.length,1);const [x,y,w,h]=cs[0].clip;assert(w>20&&h>24,'Rendered control must actually be reachable');await p.mouse.click((x+w/2)*390/s.viewport[0],(y+h/2)*844/s.viewport[1]);await p.waitForTimeout(200)}
async function capture(tag){const samples=[];for(let i=0;i<5;i++){samples.push(await p.evaluate(()=>({ux:window.__PIECEFUL_UX_STATE__.performance,wasm:window.__CONTROL_WASM_MEMORY__?.buffer.byteLength,content:window.__PIECEFUL_UX_STATE__.content,pieces:window.__PIECEFUL_UX_STATE__.pieces})));await p.waitForTimeout(400)}report.runtime.push({tag,samples});console.log('CONTROL',tag,JSON.stringify(samples.at(-1)))}
try{
 await p.goto(`${origin}/full-qa/`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof window.piecefulQaRequest==='function'&&window.__PIECEFUL_PERF_GALLERY_USABLE_MS__&&!window.__PIECEFUL_UX_STATE__.bootstrapping,null,{timeout:90000});
 report.galleryUsableQaMs=await p.evaluate(()=>window.__PIECEFUL_PERF_GALLERY_USABLE_MS__);await capture('initial-gallery');
 await click({name:'GallerySearch'});await p.keyboard.type('met_10181',{delay:15});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.controls.filter(c=>c.name.startsWith('Artwork_')).length===1);await click({name:'Artwork_met_10181'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.setup);
 const before=await p.evaluate(()=>performance.now());await click({prefix:'Start '});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.content==='met_10181'&&!window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.resume_pending);report.firstPlayableQaMs=await p.evaluate(()=>performance.now());report.startClickToObservedMs=report.firstPlayableQaMs-before;assert.equal((await state()).pieces,35);await capture('first-met_10181-35');
 for(const [id,diff,count] of [['met_12802','relaxed',40],['met_335112','standard',150],['met_12802','hard',286]]){await p.evaluate(a=>window.piecefulQaRequest('perf_start',...a),[id,diff]);await p.waitForFunction(a=>{const s=window.__PIECEFUL_UX_STATE__;return s.content===a[0]&&s.difficulty===a[1]&&!s.gallery&&!s.resume_pending},[id,diff],{timeout:90000});assert.equal((await state()).pieces,count);await capture(`${count}-pieces`)}
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log('PASS Full-App runtime control');
