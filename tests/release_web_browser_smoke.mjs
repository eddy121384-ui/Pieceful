import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const production = process.env.PIECEPACE_WEB_URL ?? 'http://127.0.0.1:4290/';
const qa = process.env.PIECEFUL_UX_QA_URL ?? 'http://127.0.0.1:4291/';
const evidence = process.env.PIECEFUL_RELEASE_EVIDENCE ?? 'build/release-browser-tests/production';
await fs.mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PIECEFUL_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PIECEFUL_CHROMIUM_EXECUTABLE } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const findings = [];
const options = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
async function ready(page) {
  await page.waitForFunction(() => window.__PIECEPACE_READY__ === true, null, { timeout: 60000 });
}
async function denyStorage(context) {
  await context.addInitScript(() => Object.defineProperty(window, 'indexedDB', {
    get() { throw new DOMException('Release test: storage denied', 'SecurityError'); },
  }));
}
try {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [], privateLogs = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/ANALYTICS_DEV|SAVE_DEBUG|SORTING_WORKSPACE_/u.test(message.text())) privateLogs.push(message.text());
  });
  await page.goto(production);
  await ready(page);
  assert.equal(await page.evaluate(() => typeof window.piecefulQaRequest), 'undefined');
  assert.equal(await page.evaluate(() => typeof window.__PIECEFUL_UX_STATE__), 'undefined');
  await page.screenshot({ path: `${evidence}/production-portrait.png` });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${evidence}/production-landscape.png` });
  await page.reload();
  await ready(page);
  assert.deepEqual(privateLogs, [], 'Release application diagnostics escaped stdout suppression');
  assert.deepEqual(errors, []);
  findings.push({ check: 'production portrait, landscape, online reload, no QA bridge/private diagnostics', passed: true });
  await context.setOffline(true);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__PIECEPACE_READY__), true);
  let offlineReloadFailed = false;
  try { await page.reload({ timeout: 15000 }); }
  catch (error) { offlineReloadFailed = /ERR_INTERNET_DISCONNECTED/u.test(error.message); }
  assert.equal(offlineReloadFailed, true, 'Review offline capability if the export profile changes');
  findings.push({ check: 'live offline tab remains loaded; offline reload is unsupported', passed: true, offlineReloadSupported: false });
  await context.close();

  const deniedProduction = await browser.newContext(options);
  await denyStorage(deniedProduction);
  const deniedPage = await deniedProduction.newPage();
  await deniedPage.goto(production);
  await ready(deniedPage);
  await deniedPage.waitForTimeout(1800);
  await deniedPage.screenshot({ path: `${evidence}/production-storage-denied.png` });
  await deniedProduction.close();

  // Read-only engine state belongs exclusively to the separate, non-shipping fixture.
  const deniedQA = await browser.newContext(options);
  await denyStorage(deniedQA);
  const fixture = await deniedQA.newPage();
  await fixture.goto(qa);
  await ready(fixture);
  await fixture.waitForFunction(() => window.__PIECEFUL_UX_STATE__?.confirmation_title === 'Progress will not be kept', null, { timeout: 30000 });
  const state = await fixture.evaluate(() => window.__PIECEFUL_UX_STATE__);
  assert.equal(state.userfs_persistent, false);
  assert.equal(state.confirmation, true);
  assert.equal(state.debug_build, false);
  assert.equal(state.stdout_enabled, false);
  findings.push({ check: 'denied IndexedDB starts without persistence and discloses loss; release engine flags', passed: true });
  await deniedQA.close();

  const failed = await browser.newContext(options);
  const failedPage = await failed.newPage();
  await failedPage.route('**/index.pck', route => route.fulfill({ status: 503, body: 'Release test: asset unavailable' }));
  await failedPage.goto(production);
  await failedPage.locator('#status-notice').waitFor({ state: 'visible', timeout: 30000 });
  assert.match(await failedPage.locator('#status-notice').textContent(), /Failed loading file/u);
  assert.equal(await failedPage.evaluate(() => window.__PIECEPACE_READY__ === true), false);
  await failedPage.screenshot({ path: `${evidence}/production-asset-failure.png` });
  findings.push({ check: 'missing production pack produces visible startup failure', passed: true });
  await failed.close();
  await fs.writeFile(`${evidence}/results.json`, JSON.stringify({ browser: 'Chromium mobile emulation; not physical Safari/Android', findings }, null, 2) + '\n');
  console.log(`PASS release_web_browser_smoke: ${findings.length} production/failure checks`);
} finally {
  await browser.close();
}
