// Actual shipping bundle, deliberately unavailable SDK network. No QA stub or
// gameplay callbacks. Live SDK/platform acceptance is a separate manual gate.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.PIECEFUL_POKI_ORIGIN ?? 'http://127.0.0.1:4294';
const out=process.env.PIECEFUL_POKI_PRODUCTION_OUTPUT ?? '/tmp/pieceful-poki-production.json';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const report={checks:[],errors:[],scope:'Shipping export, SDK script request explicitly aborted; no fake init/ad success. Live SDK downstream failures are reported separately.'};
function check(c,s){assert(c,s);report.checks.push(s);console.log('PASS',s)}
async function context(deny=false){const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.route('https://game-cdn.poki.com/**',r=>r.abort('blockedbyclient'));if(deny)await c.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Production storage-denied test','SecurityError')}}));return c}
async function ready(p){await p.waitForFunction(()=>window.__PIECEPACE_READY__&&window.PiecefulPoki?.snapshot().usable,null,{timeout:90000})}
try{
 const c=await context(),p=await c.newPage(),privateLogs=[];
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(/ANALYTICS_DEV|SAVE_DEBUG|SORTING_WORKSPACE_/.test(m.text()))privateLogs.push(m.text())});
 await p.goto(`${origin}/poki/`);await ready(p);
 check(await p.evaluate(()=>typeof window.piecefulQaRequest==='undefined'&&typeof window.pokiQaRequest==='undefined'&&typeof window.__PIECEFUL_UX_STATE__==='undefined'&&typeof window.__POKI_QA_FINISH_AD__==='undefined'),'Production contains no QA callback or success stub');
 check(await p.evaluate(()=>PiecefulPoki.snapshot().status==='failed'&&!PiecefulPoki.snapshot().loaded&&!PiecefulPoki.snapshot().playing),'Unavailable SDK remains failed at usable first screen');
 await p.screenshot({path:out.replace('.json','-portrait.png')});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(1500);await p.screenshot({path:out.replace('.json','-landscape.png')});
 await p.reload();await ready(p);check(true,'Actual production portrait, landscape and online reload reach usable screen');
 await c.setOffline(true);check(await p.evaluate(()=>__PIECEPACE_READY__),'Loaded production remains initialized when offline');let disconnected=false;try{await p.reload({timeout:15000})}catch(e){disconnected=e.message.includes('ERR_INTERNET_DISCONNECTED')}check(disconnected,'Offline reload honestly unsupported without a service worker');
 check(privateLogs.length===0,'No private development diagnostics in production');await c.close();
 const denied=await context(true),dp=await denied.newPage();dp.on('pageerror',e=>report.errors.push(e.message));await dp.goto(`${origin}/poki/`);await ready(dp);await dp.screenshot({path:out.replace('.json','-denied.png')});check(true,'Shipping build reaches usable screen with denied IndexedDB');await denied.close();
 const failed=await context(),fp=await failed.newPage();await fp.route('**/index.pck',r=>r.fulfill({status:503,body:'Explicit missing-PCK test'}));await fp.goto(`${origin}/poki/`);await fp.locator('#status-notice').waitFor({state:'visible',timeout:30000});check(/Failed loading file/.test(await fp.locator('#status-notice').textContent())&&await fp.evaluate(()=>!window.__PIECEPACE_READY__),'Missing PCK gives visible failure and no false engine ready');await failed.close();
 check(report.errors.length===0,'No uncaught application errors with SDK unavailable');report.passed=true;
}finally{await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');await browser.close()}
