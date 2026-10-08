/* Godot 4 JavaScriptBridge adapter. Only the official global SDK serves production. */
(() => {
  'use strict';
  const state = {status: 'pending', usable: false, loaded: false, desired: false,
    playing: false, hidden: document.hidden, focused: true, adPending: false,
    adResult: 'idle', error: '', events: []};
  const record = (event, detail = '') => {
    state.events.push({event, detail, time: performance.now()});
    if (state.events.length > 128) state.events.shift();
  };
  function fail(operation, error) {
    state.error = `${operation}: ${String(error?.message || error)}`;
    record('failure', state.error);
  }
  function invoke(method) {
    try { window.PokiSDK[method](); record(method); return true; }
    catch (error) { state.status = 'failed'; fail(method, error); return false; }
  }
  function reconcile() {
    if (state.status !== 'ready') return;
    if (state.usable && !state.loaded) state.loaded = invoke('gameLoadingFinished');
    const playing = state.loaded && state.desired && !state.hidden && state.focused && !state.adPending;
    if (playing !== state.playing && invoke(playing ? 'gameplayStart' : 'gameplayStop')) state.playing = playing;
  }
  // Missing/rejected SDK is observable failure. No production stub, fake init,
  // successful ad result, account, rewarded mechanic or native monetization.
  const deadline = setTimeout(() => {
    if (state.status === 'pending') { state.status = 'failed'; fail('init', 'SDK initialization timed out'); }
  }, 12000);
  try {
    if (!window.PokiSDK) throw new Error('Official Poki SDK did not load');
    record('initRequested');
    Promise.resolve(window.PokiSDK.init()).then(() => {
      clearTimeout(deadline);
      if (state.status !== 'pending') return;
      state.status = 'ready'; record('init'); reconcile();
    }, error => { clearTimeout(deadline); state.status = 'failed'; fail('init', error); });
  } catch (error) { clearTimeout(deadline); state.status = 'failed'; fail('init', error); }
  window.PiecefulPoki = {
    get status() { return state.status; },
    get hidden() { return state.hidden || !state.focused; },
    get adPending() { return state.adPending; },
    get adResult() { return state.adResult; },
    get error() { return state.error; },
    usable() { state.usable = true; record('usable'); reconcile(); },
    gameplay(active) { if (state.adPending) return; state.desired = Boolean(active); reconcile(); },
    commercialBreak() {
      if (state.adPending || !state.loaded || state.status !== 'ready' || state.hidden || !state.focused) {
        record('commercialSkipped', state.adPending ? 'overlap' : state.status);
        return false;
      }
      state.desired = false; reconcile();
      state.adPending = true; state.adResult = 'pending'; record('commercialRequested');
      try {
        Promise.resolve(window.PokiSDK.commercialBreak(() => record('commercialStarted'))).then(() => {
          state.adPending = false; state.adResult = 'resolved'; record('commercialResolved'); reconcile();
        }, error => {
          state.adPending = false; state.adResult = 'rejected'; fail('commercialBreak', error); reconcile();
        });
      } catch (error) { state.adPending = false; state.adResult = 'rejected'; fail('commercialBreak', error); }
      return true;
    },
    // Read-only bounded diagnostics; contains no save IDs, images or user data.
    snapshot() { return JSON.parse(JSON.stringify(state)); }
  };
  // Cancel browser page scroll while retaining the same Godot input events.
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  });
  window.addEventListener('wheel', event => event.preventDefault(), {passive: false});
  document.addEventListener('visibilitychange', () => { state.hidden = document.hidden; reconcile(); });
  window.addEventListener('blur', () => { state.focused = false; reconcile(); });
  window.addEventListener('focus', () => { state.focused = true; reconcile(); });
})();
