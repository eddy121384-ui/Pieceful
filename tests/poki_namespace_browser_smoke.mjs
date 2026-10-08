// Same-origin Full App ↔ Poki storage isolation and embedded-canvas lifecycle.
// Requires both separately exported QA fixtures; no production callbacks.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.PIECEFUL_POKI_ORIGIN ?? 'http://127.0.0.1:4294';
const out=process.env.PIECEFUL_POKI_NAMESPACE_OUTPUT ?? '/tmp/pieceful-poki-namespace.json';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const report={checks:[],errors:[],limitations:'Chromium iframe/focus/storage, not cross-site Safari storage certification.'};
function check(c,s){assert(c,s);report.checks.push(s);console.log('PASS',s)}
async function ready(p){await p.waitForFunction(()=>typeof window.piecefulQaRequest==='function'&&window.__PIECEFUL_UX_STATE__?.gallery&&!window.__PIECEFUL_UX_STATE__.bootstrapping,null,{timeout:90000})}
const state=p=>p.evaluate(()=>window.__PIECEFUL_UX_STATE__);
async function request(p,action,...args){await p.evaluate(a=>window.piecefulQaRequest(...a),[action,...args])}
async function start(p,id,diff='relaxed'){await request(p,'perf_start',id,diff);await p.waitForFunction(id=>window.__PIECEFUL_UX_STATE__.content===id&&!window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.resume_pending,id,{timeout:60000});await request(p,'place_one');await request(p,'perf_gallery');const saved=await state(p);const deadline=Date.now()+30000;while(Date.now()<deadline){const data=await files(p),row=Object.entries(data).find(([k])=>k.endsWith(`/saves/${saved.game}.json`));if(row){const slot=JSON.parse(row[1]);if(slot.board.solved_count===1&&slot.puzzle.content_identity.source_id===id.replace('met_','met:'))return state(p)}await p.waitForTimeout(250)}throw Error('Durable IndexedDB commit did not complete')}
async function files(p){return p.evaluate(async()=>{
 const files={};for(const info of await indexedDB.databases())if(info.name?.startsWith('/userfs')){
  await new Promise((resolve,reject)=>{const open=indexedDB.open(info.name);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('FILE_DATA');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error);const r=tx.objectStore('FILE_DATA').openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return;const key=String(c.key);if(key.includes('/saves/')&&key.endsWith('.json'))files[key]=new TextDecoder().decode(c.value.contents);c.continue()}}})}
 return files;
})}
try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(`${origin}/full-qa/`);await ready(p);const full=await start(p,'met_10189');
 if(process.env.PIECEFUL_POKI_FULL_CONTROL){await p.reload();await ready(p);await p.waitForTimeout(2500);report.control=await state(p);report.expected=full;check(report.control.content===full.content&&report.control.solved===full.solved,'Full-App-only same-build reload restores museum progress');report.passed=true;await ctx.close();}else{
 await p.goto(`${origin}/qa/`);await ready(p);const fullFiles=await files(p);
 const poki=await start(p,'met_10181','poki_quick');const both=await files(p);
 const pokiDir=await p.evaluate(()=>window.__PIECEFUL_POKI_STATE__.user_dir);
 check(pokiDir.endsWith('/Pieceful-Poki-RC1'),'Poki has explicit app_userdata namespace');
 const fullSlot=Object.entries(fullFiles).find(([k])=>k.endsWith(`/saves/${full.game}.json`));assert(fullSlot);
 check(!fullSlot[0].startsWith(pokiDir+'/'),'Full App save is outside Poki namespace');
 check(both[fullSlot[0]]===fullSlot[1],'Poki puzzle switching leaves Full-App save bytes unchanged');
 check((await state(p)).games.every(x=>x.game_id!==full.game),'Poki unfinished list does not expose Full-App slots');
 await p.goto(`${origin}/full-qa/`);await ready(p);await p.waitForTimeout(1200);report.fullExpected=full;report.fullRestored=await state(p);check((await state(p)).game===full.game&&(await state(p)).solved===1,'Full App resumes its own unchanged progress after Poki');
 const pokiFiles=await files(p),pokiSlot=Object.entries(pokiFiles).find(([k])=>k.endsWith(`/saves/${poki.game}.json`));assert(pokiSlot);
 await request(p,'perf_resume',full.game);await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.resume_pending);await request(p,'perf_gallery');await p.waitForTimeout(1200);
 check((await files(p))[pokiSlot[0]]===pokiSlot[1],'Full-App play leaves Poki save bytes unchanged');
 await p.goto(`${origin}/qa/`);await ready(p);await p.waitForTimeout(1200);report.pokiExpected=poki;report.pokiRestored=await state(p);check((await state(p)).game===poki.game&&(await state(p)).solved===1&&(await state(p)).difficulty==='poki_quick','Poki reload restores isolated Quick slot, identity and progress');
 report.namespaces={full:fullSlot[0].split('/saves/')[0],poki:pokiDir};await ctx.close();
 }
 const embed=await browser.newContext({viewport:{width:1365,height:900},hasTouch:true});
 await embed.route(`${origin}/iframe-host`,route=>route.fulfill({contentType:'text/html',body:`<html><body style="margin:0;height:2500px"><button id="outside">Outside frame</button><iframe src="/qa/" style="display:block;width:1031px;height:580px;border:0"></iframe></body></html>`}));
 const host=await embed.newPage();await host.goto(`${origin}/iframe-host`);const frame=host.frames().find(f=>f.url().includes('/qa/'));assert(frame);await ready(frame);
 check(await frame.evaluate(()=>PiecefulPoki.snapshot().usable),'Real 1031×580 iframe reaches usable screen');
 await frame.evaluate(()=>window.piecefulQaRequest('perf_start','met_10181','poki_quick'));await frame.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery);
 await frame.locator('canvas').click({position:{x:510,y:250}});await host.locator('#outside').click();
 await frame.waitForFunction(()=>PiecefulPoki.hidden&&window.__PIECEFUL_POKI_STATE__.paused);
 check(!(await frame.evaluate(()=>PiecefulPoki.snapshot().playing)),'Actual iframe focus loss pauses input/audio and stops lifecycle');
 await frame.locator('canvas').click({position:{x:510,y:250}});await frame.waitForFunction(()=>!PiecefulPoki.hidden&&!window.__PIECEFUL_POKI_STATE__.paused);
 check(true,'Actual iframe focus regain restores pause/audio ownership');
 const before=await host.evaluate(()=>scrollY);await host.mouse.move(510,250);await host.mouse.wheel(0,500);await host.waitForTimeout(500);await host.keyboard.press('ArrowDown');await host.waitForTimeout(300);
 check(await host.evaluate(()=>scrollY)===before,'Canvas wheel and arrow input do not scroll parent page');
 await embed.close();check(report.errors.length===0,'No namespace/iframe page errors');report.passed=true;
}finally{await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');await browser.close()}
