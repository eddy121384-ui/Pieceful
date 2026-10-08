/* Explicit QA export only. This file is forbidden in the submission package. */
(() => {
  'use strict';
  if (window.__PIECEFUL_POKI_QA__ !== true) throw new Error('Poki QA stub requires explicit QA export');
  const scenario = new URL(location.href).searchParams.get('sdkScenario') || 'success';
  window.__POKI_STUB_CALLS__ = [];
  const call = name => window.__POKI_STUB_CALLS__.push({name, time: performance.now()});
  if (scenario === 'missing') return;
  window.PokiSDK = {
    init() { call('init'); return scenario === 'initReject' ? Promise.reject(new Error('Explicit QA init rejection')) : Promise.resolve(); },
    gameLoadingFinished() { call('gameLoadingFinished'); },
    gameplayStart() { call('gameplayStart'); },
    gameplayStop() { call('gameplayStop'); },
    commercialBreak(onStart) {
      call('commercialBreak');
      if (scenario === 'adReject') return Promise.reject(new Error('Explicit QA ad rejection'));
      if (scenario === 'noFill') return Promise.resolve();
      onStart?.();
      return new Promise(resolve => { window.__POKI_QA_FINISH_AD__ = resolve; });
    }
  };
})();
