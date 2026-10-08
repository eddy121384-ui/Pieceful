import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../poki/web/poki_bridge.js', import.meta.url), 'utf8');
const tick = () => new Promise(setImmediate); // Flush cross-realm Promise assimilation.
async function fixture({missing=false, rejectInit=false, ad='hold'}={}) {
  const calls=[],listeners={};let finish,reject;
  const sdk={init(){calls.push('init');return rejectInit?Promise.reject(Error('blocked')):Promise.resolve();},
    gameLoadingFinished(){calls.push('loaded');},gameplayStart(){calls.push('start');},gameplayStop(){calls.push('stop');},
    commercialBreak(onStart){calls.push('ad');onStart();return ad==='reject'?Promise.reject(Error('no ad')):ad==='noFill'?Promise.resolve():new Promise((a,b)=>{finish=a;reject=b;});}};
  const document={hidden:false,addEventListener(name,fn){listeners[name]=fn;}};
  const window={addEventListener(name,fn){listeners[name]=fn;}};if(!missing)window.PokiSDK=sdk;
  const context={window,document,performance:{now:()=>0},setTimeout:()=>1,clearTimeout:()=>{}};
  vm.runInNewContext(source,context);await tick();
  return {bridge:window.PiecefulPoki,calls,document,listeners,finish:()=>finish(),reject:()=>reject(Error('denied'))};
}
test('Loading waits for both real usability and successful SDK initialization',async()=>{
 const f=await fixture();assert.deepEqual(f.calls,['init']);f.bridge.usable();f.bridge.usable();assert.deepEqual(f.calls,['init','loaded']);
});
test('Repeated gameplay state and focus/visibility use balanced lifecycle events',async()=>{
 const f=await fixture();f.bridge.usable();f.bridge.gameplay(true);f.bridge.gameplay(true);
 f.document.hidden=true;f.listeners.visibilitychange();f.listeners.visibilitychange();f.document.hidden=false;f.listeners.visibilitychange();
 f.listeners.blur();f.listeners.blur();f.listeners.focus();f.bridge.gameplay(false);f.bridge.gameplay(false);
 assert.deepEqual(f.calls,['init','loaded','start','stop','start','stop','start','stop']);
});
test('Missing SDK remains failed without fake loading/gameplay/ad success',async()=>{
 const f=await fixture({missing:true});f.bridge.usable();f.bridge.gameplay(true);assert.equal(f.bridge.status,'failed');assert.equal(f.bridge.commercialBreak(),false);assert.deepEqual(f.calls,[]);
});
test('Rejected init remains failed and retains an observable error',async()=>{
 const f=await fixture({rejectInit:true});f.bridge.usable();assert.equal(f.bridge.status,'failed');assert.match(f.bridge.error,/blocked/);assert.deepEqual(f.calls,['init']);
});
test('Commercial overlap is blocked and no automatic gameplay restart occurs',async()=>{
 const f=await fixture();f.bridge.usable();f.bridge.gameplay(true);assert.equal(f.bridge.commercialBreak(),true);assert.equal(f.bridge.commercialBreak(),false);
 assert.equal(f.bridge.adPending,true);f.finish();await tick();assert.equal(f.bridge.adPending,false);assert.deepEqual(f.calls,['init','loaded','start','stop','ad']);
});
test('Rejected/no-fill ads settle accurately without converting rejection to success',async()=>{
 for(const ad of ['reject','noFill']){const f=await fixture({ad});f.bridge.usable();f.bridge.commercialBreak();await tick();assert.equal(f.bridge.adPending,false);assert.equal(f.bridge.adResult,ad==='reject'?'rejected':'resolved');}
});

test('Midroll rejects attempted gameplay reactivation until game releases its pause',async()=>{
 const f=await fixture();f.bridge.usable();f.bridge.gameplay(true);f.bridge.commercialBreak();
 f.bridge.gameplay(true);f.listeners.focus();assert.deepEqual(f.calls,['init','loaded','start','stop','ad']);
 f.finish();await tick();assert.deepEqual(f.calls,['init','loaded','start','stop','ad']);
 f.bridge.gameplay(true);assert.deepEqual(f.calls,['init','loaded','start','stop','ad','start']);
});
