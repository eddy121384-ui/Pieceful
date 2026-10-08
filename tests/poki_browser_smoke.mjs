// Explicit QA export only: real rendered navigation and input; deterministic
// completion/join fixtures use the unchanged accepted board machinery.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.PIECEFUL_POKI_ORIGIN ?? 'http://127.0.0.1:4294';
const output=process.env.PIECEFUL_POKI_EVIDENCE ?? '/tmp/pieceful-poki-browser';
const root=process.env.PIECEFUL_REPO_ROOT ?? '/workspace/Pieceful';
const profile=JSON.parse(await fs.readFile(`${root}/poki/profile.json`,'utf8'));
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIECEFUL_CHROMIUM_EXECUTABLE,
 args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const report={browser:browser.version(),checks:[],views:[],ads:[],errors:[],limitations:'Chromium emulation/SwiftShader, not physical iOS/Android or live Poki SDK/Inspector.'};
function check(condition,label){assert(condition,label);report.checks.push(label);console.log('PASS',label)}
async function create(viewport={width:390,height:844},scenario='success',deny=false){
 const ctx=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:true});
 if(deny)await ctx.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Explicit Poki QA storage denied','SecurityError')}}));
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(`${origin}/qa/?sdkScenario=${scenario}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__ && !window.__PIECEFUL_UX_STATE__.bootstrapping && window.__PIECEFUL_POKI_STATE__ && typeof window.piecefulQaRequest==='function',null,{timeout:90000});
 await page.waitForFunction(()=>PiecefulPoki.snapshot().usable,null,{timeout:30000});
 await page.waitForTimeout(350);
 return {ctx,page};
}
const state=p=>p.evaluate(()=>window.__PIECEFUL_UX_STATE__);
const ps=p=>p.evaluate(()=>window.__PIECEFUL_POKI_STATE__);
const sdk=p=>p.evaluate(()=>PiecefulPoki.snapshot());
async function request(p,action,...args){await p.evaluate(a=>window.piecefulQaRequest(...a),[action,...args])}
async function poki(p,action,...args){await p.evaluate(a=>window.pokiQaRequest(...a),[action,...args])}
async function click(p,match,settle=300){
 for(let attempt=0;attempt<24;attempt++){
  const s=await state(p),v=p.viewportSize();
  const cs=s.controls.filter(c=>!c.disabled&&(match.name?c.name===match.name:match.role?c.role===match.role:match.prefix?c.text.startsWith(match.prefix):c.text===match.text));
  if(cs.length===0){await p.waitForTimeout(200);continue}
  assert.equal(cs.length,1,`One rendered control ${JSON.stringify(match)}: ${JSON.stringify(cs)}`);
  const c=cs[0],[x,y,w,h]=c.clip;
  if(w>20&&h>24){await p.mouse.click((x+w/2)*v.width/s.viewport[0],(y+h/2)*v.height/s.viewport[1]);await p.waitForTimeout(settle);return}
  const [sx,sy,sw,sh]=c.scroll_rect;assert(sw&&sh,`Reachable scroll path ${c.name}`);
  await p.mouse.move((sx+sw/2)*v.width/s.viewport[0],(sy+sh/2)*v.height/s.viewport[1]);
  const outsideY=c.rect[1]+c.rect[3]<=sy||c.rect[1]>=sy+sh; const outsideX=c.rect[0]+c.rect[2]<=sx||c.rect[0]>=sx+sw;
  await p.mouse.wheel(!outsideY&&outsideX?(c.rect[0]<sx?-250:250):0,outsideY||!outsideX?(c.rect[1]<sy?-250:250):0);await p.waitForTimeout(180);
 }
 await fs.writeFile(`${output}/unreachable.json`,JSON.stringify(await state(p),null,2));await p.screenshot({path:`${output}/unreachable.png`});throw Error(`Control remains clipped ${JSON.stringify(match)}`);
}
async function artwork(p,id){
 await click(p,{name:'GallerySearch'});await p.keyboard.press('Control+A');await p.keyboard.type(id,{delay:15});
 await p.waitForFunction(id=>window.__PIECEFUL_UX_STATE__.controls.filter(c=>c.name.startsWith('Artwork_')).length===1&&window.__PIECEFUL_UX_STATE__.controls.some(c=>c.name==='Artwork_'+id),id);
 await click(p,{name:'Artwork_'+id});
}
async function select(p,index){
 await click(p,{name:(await state(p)).piece_picker});
 await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.menus.length>0);
 const s=await state(p),m=s.menus.find(x=>x.name===s.piece_picker),[x,y,w,h]=m.rect,v=p.viewportSize();
 check(m.count===4,'Four player difficulty choices, no stress tiers');
 await p.mouse.click((x+w/2)*v.width/s.viewport[0],(y+18+(h-36)/m.count*(index+.5))*v.height/s.viewport[1]);
 await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.menus.length);await p.waitForTimeout(200);
}
async function start(p){await click(p,{prefix:'Start '});await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.resume_pending,null,{timeout:60000})}
async function drag(p,from,to,touch=false){
 const s=await state(p),v=p.viewportSize(),map=a=>({x:a[0]*v.width/s.viewport[0],y:a[1]*v.height/s.viewport[1]}),a=map(from),b=map(to);
 const cdp=touch?await p.context().newCDPSession(p):null;
 if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});
 else {await p.mouse.move(a.x,a.y);await p.mouse.down()}
 await p.waitForTimeout(200);
 for(let i=1;i<=10;i++){
  const pos={x:a.x+(b.x-a.x)*i/10,y:a.y+(b.y-a.y)*i/10};
  if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...pos,id:1}]});else await p.mouse.move(pos.x,pos.y);
  await p.waitForTimeout(50);
 }
 if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}else await p.mouse.up();
 await p.waitForTimeout(650);
}
async function toggle(p,label,joined=false){
 await p.evaluate(()=>window.__PIECEFUL_TRANSITION_FRAMES__=[]);
 await click(p,{name:'LoosePieceLayoutButton'},0);
 await p.waitForFunction(()=>window.__PIECEFUL_TRANSITION__?.active);
 await p.waitForFunction(()=>!window.__PIECEFUL_TRANSITION__.active);
 const frames=await p.evaluate(()=>window.__PIECEFUL_TRANSITION_FRAMES__);
 check(frames.length>=2,`${label}: actual transition frames`);
 let island=false;
 for(const f of frames){assert.equal(f.root_z,4096);for(const g of f.groups){island ||= g.holders.length>1;for(const layers of g.holders){
  assert.deepEqual(layers.map(l=>l.name),['ContactShadow','Thickness','Face','EdgeRelief']);
  assert(layers.every(l=>l.z===0&&l.relative));assert(Math.hypot(...layers[1].offset)>0);assert(layers[3].width>0);
  assert.equal(layers[3].material,`PuzzlePieceEdgeRelief_${g.holders.length>1?'joined':'loose'}`);
 }}}
 if(joined)assert(island,'Joined island actually animated');
 check(true,`${label}: shared cardboard layers and z-order, no white outline`);
 await p.waitForTimeout(250);
}
async function durable(p,saved){
 await p.waitForFunction(async expected=>{
  for(const info of await indexedDB.databases())if(info.name?.startsWith('/userfs')){
   const match=await new Promise((resolve,reject)=>{const o=indexedDB.open(info.name);o.onerror=()=>reject(o.error);o.onsuccess=()=>{const db=o.result,tx=db.transaction('FILE_DATA'),r=tx.objectStore('FILE_DATA').openCursor();let found=false;tx.oncomplete=()=>{db.close();resolve(found)};r.onsuccess=()=>{const c=r.result;if(!c)return;if(String(c.key).endsWith(`/saves/${expected.game}.json`)){const slot=JSON.parse(new TextDecoder().decode(c.value.contents));found=slot.board.solved_count===expected.solved&&slot.puzzle.content_identity.source_id===expected.content_identity.source_id}c.continue()}}});
   if(match)return true;
  }return false;
 },saved,{timeout:30000});
}
async function sample(p,name){await p.screenshot({path:`${output}/${name}.png`});report.views.push({name,ux:await state(p),poki:await ps(p),sdk:await sdk(p)})}
try{
 for(const [name,viewport] of (process.env.PIECEFUL_POKI_SKIP_VIEWS ? [] : [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}],['desktop',{width:1365,height:768}],['tablet-portrait',{width:768,height:1024}],['tablet-landscape',{width:1024,height:768}]])){
  const {ctx,page:p}=await create(viewport);
  check((await state(p)).setup&& (await state(p)).pending===profile.featured_content_id,`${name}: featured first actionable setup`);
  check(!(await sdk(p)).playing,`${name}: setup does not emit gameplayStart`);
  await sample(p,`${name}-featured`);
  await select(p,0);await start(p);check((await state(p)).pieces===12,`${name}: Quick uses exact existing 12-piece pattern`);
  const s=await state(p),candidates=s.piece_points.filter(x=>!x.solved&&x.pickable&&x.visible&&x.point[0]>60&&x.point[0]<s.viewport[0]-60&&x.point[1]>150&&x.point[1]<s.viewport[1]-190).sort((a,b)=>b.z-a.z);
  assert(candidates.length,'Actual visible loose piece');const piece=candidates[0];
  await drag(p,piece.point,[piece.point[0]+35,piece.point[1]-25],name!=='desktop');
  const moved=(await state(p)).piece_points.find(x=>x.index===piece.index);
  check(Math.hypot(moved.point[0]-piece.point[0],moved.point[1]-piece.point[1])>10,`${name}: real ${name==='desktop'?'mouse':'touch'} drag works`);
  check((await sdk(p)).playing,`${name}: SDK starts on actual puzzle manipulation`);
  if(name==='portrait'){
   const cdp=await ctx.newCDPSession(p),before=await ps(p),v=p.viewportSize();
   const send=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
   await send('touchStart',[{x:v.width*.4,y:v.height*.42,id:1},{x:v.width*.6,y:v.height*.42,id:2}]);
   for(let i=1;i<=8;i++){await send('touchMove',[{x:v.width*.4-i*3,y:v.height*.42,id:1},{x:v.width*.6+i*3,y:v.height*.42,id:2}]);await p.waitForTimeout(50)}
   await p.waitForTimeout(300);check((await ps(p)).camera_zoom>before.camera_zoom,'Portrait: real two-finger pinch increases camera zoom');
   const zoomed=await ps(p);
   for(let i=1;i<=5;i++){await send('touchMove',[{x:v.width*.4-24+i*3,y:v.height*.42+i*3,id:1},{x:v.width*.6+24+i*3,y:v.height*.42+i*3,id:2}]);await p.waitForTimeout(50)}
   await send('touchEnd',[]);await cdp.detach();await p.waitForTimeout(400);
   check(Math.hypot(...(await ps(p)).camera_position.map((x,i)=>x-zoomed.camera_position[i]))>1,'Portrait: two-finger camera pan');
  }
  await toggle(p,`${name}-scatter-rail`);await toggle(p,`${name}-rail-scatter`);
  if(name==='portrait'){
   await request(p,'join_loose',0);await toggle(p,'joined-table-to-rail');
   const joined=await state(p);await drag(p,joined.piece_points.find(x=>x.index===0).point,joined.rail_drop_point);
   check(!(await state(p)).piece_points.find(x=>x.index===0).pickable,'Joined loose cluster stores via real Rail drag');
   await toggle(p,'joined-rail-to-scatter',true);
   const restored=await state(p);check(restored.piece_points[0].cluster===restored.piece_points[1].cluster&&restored.piece_points[0].pickable,'Joined cluster remains joined and draggable after handoff');
  }
  await click(p,{role:'picture'});check((await state(p)).picture_mode!=='off',`${name}: accessible picture reference`);
  await click(p,{role:'picture'});await click(p,{role:'picture'});
  await click(p,{name:'AlbumMore'});await click(p,{text:'Pause'});
  await p.waitForFunction(()=>window.__PIECEFUL_POKI_STATE__.paused);
  check(!(await sdk(p)).playing,`${name}: pause stops gameplay lifecycle`);
  await click(p,{text:'Keep playing'});await p.waitForFunction(()=>!window.__PIECEFUL_POKI_STATE__.paused);
  await sample(p,`${name}-playing`);
  await click(p,{name:'ProductGalleryButton'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.setup);
  await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery);
  const gallery=await state(p);check(!gallery.controls.some(x=>/My Photos|Share result|History|Replay|Settings/.test(x.text)),`${name}: app-only actions hidden`);
  check(!(await sdk(p)).playing,`${name}: Gallery stops gameplay`);
  check((await ps(p)).thumbnail_count<=12,`${name}: bounded lazy thumbnails`);
  await sample(p,`${name}-gallery`);
  await ctx.close();
 }
 const {ctx,page:p}=await create({width:1365,height:768});
 await click(p,{text:'Back to Gallery'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.setup);
 check((await state(p)).controls.filter(x=>x.name.startsWith('Artwork_')).length===35,'Complete 35-artwork catalog is browsable');
 for(const id of (process.env.PIECEFUL_POKI_FOCUSED_ONLY ? [] : profile.artwork_ids)){
  await artwork(p,id);await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.setup);
  await select(p,0);await start(p);const s=await state(p);
  check(s.content===id&&s.pieces===12&&!s.save_error,`Playable immutable artwork ${id}`);
  check(s.content_identity.source_id===id.replace('met_','met:'),`Canonical source identity ${id}`);
  assert.equal((await ps(p)).full_art_cache_count,1);assert((await ps(p)).thumbnail_count<=12);
  await click(p,{name:'ProductGalleryButton'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.setup);
 }
 // Real rendered difficulty choices for actual count representatives, not
 // geometry changes or confusing nominal tiers with resolved counts.
 for(const [id,index,count] of (process.env.PIECEFUL_POKI_FOCUSED_ONLY ? [] : [['met_12802',1,40],['met_335112',2,150],['met_12802',3,286]])){
  await artwork(p,id);await select(p,index);await start(p);
  check((await state(p)).pieces===count,`Existing native-aspect ${count}-piece gameplay`);
  if(count===286){for(let i=0;i<6;i++)await toggle(p,`286-repeat-${i}`)}
  await click(p,{name:'ProductGalleryButton'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.setup);
 }
 // Real snapping and durable reload; finish with a QA completion fixture.
 await artwork(p,'met_10181');await select(p,0);await start(p);
 for(let attempt=0;attempt<15&&(await state(p)).solved<2;attempt++){
  const s=await state(p),cs=s.piece_points.filter(x=>!x.solved&&x.pickable&&x.visible&&x.point[0]>60&&x.point[0]<s.viewport[0]-60&&x.point[1]>150&&x.point[1]<s.viewport[1]-180).sort((a,b)=>b.z-a.z);
  assert(cs.length);await drag(p,cs[attempt%cs.length].point,cs[attempt%cs.length].target);
 }
 check((await state(p)).solved>=2,'Real drag-to-target snapping and progress');const saved=await state(p);
 await click(p,{name:'ProductGalleryButton'});await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.setup);await durable(p,saved);await p.reload();
 await p.waitForFunction(()=>typeof window.piecefulQaRequest==='function'&&window.__PIECEFUL_UX_STATE__?.game&&!window.__PIECEFUL_UX_STATE__.bootstrapping,null,{timeout:90000});
 check((await state(p)).game===saved.game&&(await state(p)).solved===saved.solved,'Same-origin reload restores exact active slot and solved count');
 await request(p,'perf_resume',saved.game);await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.resume_pending);
 await request(p,'complete');await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.completion);
 check((await state(p)).history_count>0,'Accepted completion history still persists');
 await click(p,{text:'Choose next puzzle'});check(!(await sdk(p)).adPending,'Completion-to-library has no commercial break');await artwork(p,'met_12802');
 await poki(p,'mute',true);await poki(p,'drag_busy',true);await poki(p,'ad');
 check(!(await sdk(p)).adPending,'Completion does not start ad during active drag');await poki(p,'drag_busy',false);
 await poki(p,'transition_busy',true);await poki(p,'ad');check(!(await sdk(p)).adPending,'Completion does not start ad during layout animation');await poki(p,'transition_busy',false);
 await click(p,{prefix:'Start '},0);await p.waitForFunction(()=>window.__PIECEFUL_POKI_STATE__.ad_locked&&window.__PIECEFUL_POKI_STATE__.paused);
 check((await ps(p)).master_muted,'Ad owns pause and audio mute');const pending=await sdk(p);
 await poki(p,'ad');check((await sdk(p)).events.filter(x=>x.event==='commercialRequested').length===pending.events.filter(x=>x.event==='commercialRequested').length,'Overlapping ad is rejected');
 await sample(p,'commercial-pending');await p.evaluate(()=>window.__POKI_QA_FINISH_AD__());
 await p.waitForFunction(()=>!window.__PIECEFUL_POKI_STATE__.ad_locked&&!window.__PIECEFUL_POKI_STATE__.paused);
 check((await ps(p)).master_muted,'Ad preserves previously muted audio');check(!(await state(p)).gallery,'Ad resolves into actual next-puzzle gameplay');
 report.ads.push({scenario:'success',sdk:await sdk(p)});await ctx.close();
 for(const scenario of ['adReject','noFill','initReject','missing']){
  const {ctx,page:p}=await create(undefined,scenario);await select(p,0);await start(p);await poki(p,'mute',false);
  await request(p,'complete');await p.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.completion);await click(p,{text:'Choose next puzzle'});await artwork(p,'met_359362');await click(p,{prefix:'Start '});
  await p.waitForFunction(()=>!window.__PIECEFUL_UX_STATE__.gallery&&!window.__PIECEFUL_UX_STATE__.completion&&!window.__PIECEFUL_POKI_STATE__.paused);
  const snap=await sdk(p);check(!(await ps(p)).master_muted,`${scenario}: audio restored`);
  check(!snap.adPending,`${scenario}: no hung input/ad lock`);
  if(scenario==='initReject'||scenario==='missing')check(snap.status==='failed'&&!snap.loaded,`${scenario}: unavailable SDK is not reported as successful`);
  if(scenario==='adReject')check(snap.adResult==='rejected','Rejected commercial break remains observable');
  if(scenario==='noFill')check(snap.adResult==='resolved'&&!snap.events.some(x=>x.event==='commercialStarted'),'No-fill resolves without inventing ad display');
  report.ads.push({scenario,sdk:snap});await ctx.close();
 }
 const denied=await create(undefined,'missing',true);await denied.page.waitForFunction(()=>window.__PIECEFUL_UX_STATE__.confirmation_title==='Progress will not be kept');check((await state(denied.page)).confirmation,'Denied storage discloses loss');await click(denied.page,{text:'Close'});await select(denied.page,0);await start(denied.page);
 check(!(await state(denied.page)).userfs_persistent,'Denied IndexedDB remains playable with honest persistence state');await denied.ctx.close();
 check(report.errors.length===0,`No unexpected browser errors (${report.errors.join('; ')})`);
 report.passed=true;
}finally{await fs.writeFile(`${output}/results.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log('PASS poki_browser_smoke',report.checks.length);
