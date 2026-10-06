// Create real old-build saves, then replace ONLY its PCK on the SAME origin.
// Requires independently exported before/after non-shipping QA fixtures.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const origin=process.env.PIECEFUL_PERF_ORIGIN ?? 'http://127.0.0.1:4290';
const root=process.env.PIECEFUL_REPO_ROOT ?? '/workspace/Pieceful';
const out=process.env.PIECEFUL_UPGRADE_OUTPUT ?? '/tmp/pieceful-catalog-upgrade.json';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
async function state(){return await page.evaluate(()=>window.__PIECEFUL_UX_STATE__)}
async function ready(){await page.waitForFunction(()=>typeof window.piecefulQaRequest==='function' && window.__PIECEFUL_UX_STATE__?.gallery && !window.__PIECEFUL_UX_STATE__.bootstrapping,null,{timeout:60000})}
async function request(action,...args){await page.evaluate(args=>window.piecefulQaRequest(...args),[action,...args])}
async function start(id){await request('perf_start',id,'relaxed');await page.waitForFunction(id=>{const s=window.__PIECEFUL_UX_STATE__;return s?.content===id && !s.gallery && !s.resume_pending},id,{timeout:60000});return await state()}
async function files(){return await Promise.race([page.evaluate(async()=>{
  const result={};
  for(const info of await indexedDB.databases()) if(info.name?.startsWith('/userfs')) {
    await new Promise((resolve,reject)=>{
      const open=indexedDB.open(info.name);
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{
        const db=open.result;
        const tx=db.transaction('FILE_DATA');
        tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error);
        const cursor=tx.objectStore('FILE_DATA').openCursor();
        cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;
          try {
            const key=String(c.key);
            if(key.endsWith('.json') && (key.includes('/saves/') || key.endsWith('/pieceful_journal_v1.json')) && c.value.contents) {
              result[key]=JSON.parse(new TextDecoder().decode(c.value.contents));
              result[key+':mtime']=Number(c.value.timestamp);
            }
          } catch(error) {reject(error);return;}
          c.continue();
        };
      };
    });
  }
  return result;
}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('IndexedDB fixture read timed out')),30000))])}
function find(records,suffix){return Object.entries(records).find(([key])=>key.endsWith(suffix))?.[1]}
function comparePieces(actual, expected) {
  assert.equal(actual.length,expected.length);
  let maxDrift=0;
  for(let i=0;i<actual.length;i++) {
    const {position_norm:a,...actualState}=actual[i];
    const {position_norm:e,...expectedState}=expected[i];
    assert.deepEqual(actualState,expectedState,'Index, location, solved, rotation and z persist exactly');
    assert.equal(Boolean(a),Boolean(e),'Coordinate field presence persists');
    if(!a) continue; // Solved pieces are placed by unchanged puzzle geometry.
    assert.equal(a.length,e.length);
    for(let j=0;j<a.length;j++) {
      const drift=Math.abs(a[j]-e[j]);maxDrift=Math.max(maxDrift,drift);
      // Existing float32 board-coordinate -> normalized JSON round trip.
      // Less than 0.001 logical pixels; geometry and all discrete state exact.
      assert(drift<1e-6,`Normalized position changed materially: ${drift}`);
    }
  }
  return maxDrift;
}
async function committed(game,afterStamp=-1){
  for(let i=0;i<60;i++){const records=await files();const saved=find(records,`/saves/${game}.json`);const stamp=find(records,`/saves/${game}.json:mtime`);if(saved?.board?.solved_count===1 && stamp>afterStamp)return saved;await page.waitForTimeout(500)}
  throw new Error('Old save not committed to IndexedDB');
}
const report={passed:false,oldSaves:[],checks:[],errors};
try {
  await page.goto(`${origin}/perf-before-qa/`,{waitUntil:'domcontentloaded'});await ready();
  console.log('Old fixture ready');
  await request('perf_catalog_identity');
  console.log('Old hashes collected');
  const oldHashes=await page.evaluate(()=>window.__PIECEFUL_CATALOG_IDENTITY_PROBE__);
  assert.equal(oldHashes.length,38);assert(oldHashes.every(row=>row.raw_present && row.sha256.length===64));
  report.checks.push('Old export hashes all 38 original source files');
  const museum=(await start('met_10181')).game;
  console.log('Old museum started',museum);
  await request('place_one');await request('perf_gallery');
  const museumSnapshot=await committed(museum);
  console.log('Old museum committed');
  const photoBytes=await fs.readFile(`${root}/tests/fixtures/product-ux-photo.png`);
  await request('perf_photo',photoBytes.toString('base64'));
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.pending.startsWith('photo_'));
  const photoId=(await state()).pending;
  const photo=(await start(photoId)).game;
  await request('place_one');await request('perf_gallery');
  const photoSnapshot=await committed(photo);
  const oldPhotoStamp=find(await files(),`/saves/${photo}.json:mtime`);
  console.log('Old photo committed');
  // Actual same-build reload control, so normal float32 normalization drift
  // is distinguishable from changing identity or restoring wrong geometry.
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  await request('perf_resume',photo);
  await page.waitForFunction(game=>window.__PIECEFUL_UX_STATE__.game===game && !window.__PIECEFUL_UX_STATE__.resume_pending,photo);
  await request('perf_gallery');await page.waitForTimeout(1200);
  const controlSnapshot=await committed(photo,oldPhotoStamp);
  report.oldBuildPhotoRoundTripMaxNormalizedDrift=comparePieces(controlSnapshot.board.pieces,photoSnapshot.board.pieces);
  assert.deepEqual(controlSnapshot.puzzle,photoSnapshot.puzzle);
  await start('garden');await request('complete');
  await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.completion);
  await request('perf_gallery');
  let oldFiles;
  for(let i=0;i<60;i++){oldFiles=await files();if(find(oldFiles,'/pieceful_journal_v1.json')?.completions?.length)break;await page.waitForTimeout(500)}
  assert(find(oldFiles,'/pieceful_journal_v1.json')?.completions?.length);
  report.checks.push('Old build commits museum + photo progress and completed history');
  await page.route('**/perf-before-qa/index.pck',route=>route.fulfill({path:process.env.PIECEFUL_UPGRADE_AFTER_PACK ?? `${root}/build/perf-after-qa/index.pck`,contentType:'application/octet-stream'}));
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  console.log('New fixture ready');
  assert((await state()).userfs_persistent);
  await request('perf_catalog_identity');
  const newHashes=await page.evaluate(()=>window.__PIECEFUL_CATALOG_IDENTITY_PROBE__);
  assert.equal(newHashes.length,38);assert(newHashes.every(row=>!row.raw_present));
  assert.deepEqual(newHashes.map(({path,sha256})=>({path,sha256})),oldHashes.map(({path,sha256})=>({path,sha256})));
  report.checks.push('New export has no raw catalog files; all 38 runtime hashes equal old build');
  for(const [game,id,snapshot] of [[museum,'met_10181',museumSnapshot],[photo,photoId,photoSnapshot]]) {
    const previousStamp=find(await files(),`/saves/${game}.json:mtime`);
    await request('perf_resume',game);
    await page.waitForFunction(args=>{const s=window.__PIECEFUL_UX_STATE__;return s?.game===args[0] && s.content===args[1] && s.solved===1 && !s.resume_pending},[game,id],{timeout:60000});
    assert.deepEqual((await state()).content_identity,snapshot.puzzle.content_identity);
    await request('perf_gallery');
    const restored=await committed(game,previousStamp);
    assert.deepEqual(restored.puzzle,snapshot.puzzle);
    const maxDrift=comparePieces(restored.board.pieces,snapshot.board.pieces);
    report.oldSaves.push({game,content:id,sha256:snapshot.puzzle.content_identity.sha256,pieces:snapshot.board.pieces.length,solved:restored.board.solved_count,maxNormalizedPositionDrift:maxDrift});
  }
  const afterFiles=await files();
  assert.deepEqual(find(afterFiles,'/pieceful_journal_v1.json'),find(oldFiles,'/pieceful_journal_v1.json'));
  report.checks.push('Both old slots resume exact identity/geometry/discrete state; normalized positions within 1e-6; history unchanged');
  assert.deepEqual(errors,[]);report.passed=true;
} finally {await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log('PASS catalog_export_upgrade_browser_smoke',out);
