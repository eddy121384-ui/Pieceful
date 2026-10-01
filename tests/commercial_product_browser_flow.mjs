import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Run against the separate commercial_product_browser_fixture.tscn export.
// The shipped main scene has no QA callback. All navigation below uses mouse
// input on current rendered control bounds, not direct game method invocation.
const url = process.env.PIECEFUL_UX_QA_URL ?? 'http://127.0.0.1:4176/';
const evidence = process.env.PIECEFUL_UX_EVIDENCE ?? '/tmp/pieceful-ux-browser-evidence';
await fs.mkdir(evidence, { recursive: true });
const executablePath = process.env.PIECEFUL_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
await page.addInitScript(() => {
  window.__PIECEFUL_IDB_FAILURES__ = [];
  const original = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args) {
    const transaction = original.apply(this, args);
    transaction.addEventListener('error', event => {
      window.__PIECEFUL_IDB_FAILURES__.push({ name: event.target.error?.name, message: event.target.error?.message, store: String(args[0]) });
    }, true);
    return transaction;
  };
});
const errors = [];
const journeys = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} (after screenshot ${step})`); });
let step = 0;

async function state() {
  return await page.evaluate(() => window.__PIECEFUL_UX_STATE__);
}
async function ready() {
  await page.waitForFunction(() => window.__PIECEPACE_READY__ === true && window.__PIECEFUL_UX_STATE__, null, { timeout: 60000 });
  await page.waitForFunction(() => !window.__PIECEFUL_UX_STATE__.bootstrapping && window.__PIECEFUL_UX_STATE__.gallery, null, { timeout: 60000 });
  await page.waitForTimeout(800);
}
async function expect(predicate, description) {
  await page.waitForFunction(predicate, null, { timeout: 15000 });
  journeys.push(description);
}
async function capture(name) {
  await page.waitForTimeout(500);
  const path = `${evidence}/${String(++step).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path });
  console.log('CAPTURE', path);
  const current = await state();
  console.log('STATE', JSON.stringify(Object.fromEntries(Object.entries(current).filter(([key]) => !['controls', 'games', 'piece_points'].includes(key)))));
}
async function click(match) {
  await page.locator('canvas').waitFor({ state: 'visible' });
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = await state();
    const candidates = current.controls.filter(control => !control.disabled && (match.role ? control.role === match.role : match.name ? control.name === match.name : match.prefix ? control.text.startsWith(match.prefix) : control.text === match.text));
    assert.equal(candidates.length, 1, `One current control expected for ${JSON.stringify(match)}: ${JSON.stringify(candidates)}`);
    const control = candidates[0];
    const { width, height } = page.viewportSize();
    const scaleX = width / current.viewport[0], scaleY = height / current.viewport[1];
    const [x, y, w, h] = control.clip;
    if (w > 30 && h > 40) {
      await page.mouse.click((x + w / 2) * scaleX, (y + h / 2) * scaleY);
      await page.waitForTimeout(500);
      return;
    }
    const [sx, sy, sw, sh] = control.scroll_rect;
    assert(sw > 0 && sh > 0, `Control is clipped without a scroll path: ${JSON.stringify(control)}`);
    await page.mouse.move((sx + sw / 2) * scaleX, (sy + sh / 2) * scaleY);
    await page.mouse.wheel(0, control.rect[1] < sy ? -180 : 180);
    await page.waitForTimeout(500);
  }
  throw new Error(`Control never became reachable: ${JSON.stringify(match)}`);
}

async function selectOption(name, index, captureName) {
  await click({ name });
  await page.waitForFunction(() => window.__PIECEFUL_UX_STATE__.menus.length > 0);
  if (captureName) await capture(captureName);
  const current = await state();
  const menu = current.menus.find(item => item.name === name);
  assert(menu && index < menu.count, 'Requested rendered menu item exists');
  const [x, y, w, h] = menu.rect;
  const row = (h - 36) / menu.count;
  const viewport = page.viewportSize();
  await page.mouse.click((x + w / 2) * viewport.width / current.viewport[0], (y + 18 + row * (index + 0.5)) * viewport.height / current.viewport[1]);
  await page.waitForTimeout(700);
  await page.waitForFunction(() => window.__PIECEFUL_UX_STATE__.menus.length === 0);
}

async function persistedGame(game, solved) {
  // FileAccess success is the in-memory filesystem write. Observe the actual
  // IndexedDB commit before intentionally restarting the browser runtime.
  await page.waitForFunction(async ({ game, solved }) => {
    const databases = await indexedDB.databases();
    for (const info of databases.filter(item => item.name?.startsWith('/userfs'))) {
      const found = await new Promise(resolve => {
        const open = indexedDB.open(info.name);
        open.onerror = () => resolve(false);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('FILE_DATA')) { db.close(); resolve(false); return; }
          const request = db.transaction('FILE_DATA').objectStore('FILE_DATA').openCursor();
          request.onerror = () => { db.close(); resolve(false); };
          request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) { db.close(); resolve(false); return; }
            if (String(cursor.key).endsWith(`/saves/${game}.json`)) {
              const saved = JSON.parse(new TextDecoder().decode(cursor.value.contents));
              db.close(); resolve(saved.board.solved_count === solved); return;
            }
            cursor.continue();
          };
        };
      });
      if (found) return true;
    }
    return false;
  }, { game, solved }, { timeout: 30000, polling: 200 });
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready();
  await expect(() => window.__PIECEFUL_UX_STATE__.gallery && !window.__PIECEFUL_UX_STATE__.setup, 'First launch resolves to Gallery');
  assert.equal((await state()).save_error, '', 'Packaged artwork bytes support durable content identity');
  assert((await state()).game, 'Fresh browser owns a durable provisional slot');
  await capture('first-gallery');
  await click({ name: 'Artwork_garden' });
  await expect(() => window.__PIECEFUL_UX_STATE__.setup, 'New player: picture opens piece-count setup');
  await selectOption((await state()).piece_picker, 0, 'piece-count-choices');
  await capture('picture-setup');
  await click({ text: 'Start puzzle' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.gallery, 'Start opens gameplay');
  await capture('gameplay');
  const dragState = await state();
  const dragPiece = dragState.piece_points.find(piece => !piece.solved && piece.point[0] > 100 && piece.point[0] < 620 && piece.point[1] > 900 && piece.point[1] < 1300);
  assert(dragPiece, 'A loose piece is available clear of gameplay controls');
  const dragX = dragPiece.point[0] * 390 / dragState.viewport[0];
  const dragY = dragPiece.point[1] * 844 / dragState.viewport[1];
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  await page.waitForTimeout(300);
  for (let move = 1; move <= 8; move++) {
    await page.mouse.move(dragX + 3 * move, dragY + 3 * move);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(700);
  const movedPiece = (await state()).piece_points.find(piece => piece.index === dragPiece.index);
  assert(Math.hypot(movedPiece.point[0] - dragPiece.point[0], movedPiece.point[1] - dragPiece.point[1]) > 10, 'Real mouse input moves a loose piece');
  journeys.push('First puzzle interaction drags a real loose piece');
  await capture('first-piece-drag');
  const firstGame = (await state()).game;
  await page.evaluate(() => window.piecefulQaRequest('place_one'));
  await expect(() => window.__PIECEFUL_UX_STATE__.solved === 1, 'Placed cluster fixture creates real saved progress');
  await click({ name: 'ProductGalleryButton' });
  await expect(() => window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.solved === 1, 'Leave returns to Gallery with progress intact');
  await capture('saved-gallery');
  await persistedGame(firstGame, 1);
  await page.reload();
  await ready();
  assert.equal((await state()).game, firstGame);
  assert.equal((await state()).solved, 1);
  await capture('returning-gallery');
  await click({ prefix: 'Continue ·' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.solved === 1, 'Returning player continues exact saved progress');
  await click({ role: 'picture' });
  await capture('picture-reference');
  const hintBefore = (await state()).hint;
  await click({ role: 'hint' });
  await page.waitForFunction(previous => window.__PIECEFUL_UX_STATE__.hint !== previous, hintBefore);
  journeys.push('Hint assist toggles through its real control');
  await capture('hint-assist');
  await click({ role: 'hint' });
  await click({ role: 'trays' });
  await capture('trays');
  // Close the tray manager through the visible Close control, retaining the
  // mature sorting controller's real bindings.
  const trayClose = (await state()).controls.find(control => /ManagerClose|TrayManagerClose/.test(control.name));
  if (trayClose) await click({ name: trayClose.name });
  else {
    const close = (await state()).controls.filter(control => control.text === '' && /Close/.test(control.name));
    assert.equal(close.length, 1, 'One tray close affordance');
    await click({ name: close[0].name });
  }
  const pieces = (await state()).controls.find(control => /LoosePieceLayoutButton/.test(control.name));
  assert(pieces, 'Pieces control is present');
  await click({ name: pieces.name });
  await capture('pieces-strip');
  await click({ name: 'AlbumMore' });
  await capture('more-tools');
  await click({ text: 'Reshuffle pieces' });
  await expect(() => window.__PIECEFUL_UX_STATE__.confirmation, 'Reshuffle shows a consequence-aware confirmation');
  await capture('reshuffle-confirmation');
  await page.keyboard.press('Escape');
  await expect(() => !window.__PIECEFUL_UX_STATE__.confirmation && window.__PIECEFUL_UX_STATE__.solved === 1, 'Cancel preserves placed pieces');
  await page.keyboard.press('Escape');
  await click({ name: 'ProductGalleryButton' });
  await click({ name: 'Favorite_garden' });
  await click({ text: 'Favorites' });
  await capture('favorites');
  await click({ text: 'My photos' });
  await capture('my-photos-empty');
  if (process.env.PIECEFUL_TEST_PHOTO) {
    await click({ text: 'Choose a photo' });
    await page.locator('input[type=file]').setInputFiles(process.env.PIECEFUL_TEST_PHOTO);
    await expect(() => window.__PIECEFUL_UX_STATE__.setup && window.__PIECEFUL_UX_STATE__.pending.startsWith('photo_'), 'Photo picker imports a private setup candidate');
    assert.equal((await state()).content, 'garden');
    assert.equal((await state()).solved, 1);
    await capture('photo-setup-safe');
    await click({ text: 'Back to Gallery' });
  }
  await click({ text: 'Settings' });
  await expect(() => window.__PIECEFUL_UX_STATE__.settings, 'Settings is reachable independently of discovery');
  await capture('settings');
  await page.keyboard.press('Escape');
  await click({ text: 'Browse' });
  await click({ name: 'GallerySearch' });
  await page.keyboard.type('Twilight');
  await page.waitForTimeout(700);
  assert((await state()).controls.some(control => control.name === 'Artwork_twilight_lake'));
  assert(!(await state()).controls.some(control => control.name === 'Artwork_garden'));
  await capture('search-results');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await selectOption('GalleryCategoryFilter', 1);
  await capture('theme-filter');
  await click({ text: 'Browse' });
  await selectOption('GalleryStatusFilter', 1);
  await capture('for-you-filter');
  await click({ text: 'Browse' });
  await click({ name: 'Artwork_twilight_lake' });
  await click({ text: 'Start puzzle' });
  await expect(() => window.__PIECEFUL_UX_STATE__.content === 'twilight_lake' && !window.__PIECEFUL_UX_STATE__.gallery, 'Switching starts a separate puzzle');
  assert.equal((await state()).games.length, 2);
  await click({ name: 'ProductGalleryButton' });
  await click({ prefix: 'All unfinished puzzles' });
  await expect(() => window.__PIECEFUL_UX_STATE__.sessions, 'All unfinished puzzles is a direct discovery destination');
  await capture('unfinished-puzzles');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1200);
  await capture('landscape-gallery');
  await click({ name: 'Artwork_garden' });
  await expect(() => window.__PIECEFUL_UX_STATE__.setup, 'Landscape discovery can reach artwork setup');
  await capture('landscape-setup');
  await click({ text: 'Back to Gallery' });
  await click({ prefix: 'Continue ·' });
  await capture('landscape-gameplay');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.piecefulQaRequest('complete'));
  await expect(() => window.__PIECEFUL_UX_STATE__.completion && window.__PIECEFUL_UX_STATE__.solved === window.__PIECEFUL_UX_STATE__.pieces, 'Real solved-cluster completion enters result flow');
  await capture('completion');
  const replay = (await state()).controls.find(control => /CompletionTimelapseReplay/.test(control.name));
  if (replay && !replay.disabled) {
    await click({ name: replay.name });
    await expect(() => window.__PIECEFUL_UX_STATE__.replay, 'Completed puzzle replay opens');
    await capture('replay');
    const current = await state();
    const close = current.controls.find(control => control.name === current.replay_close);
    assert(close, 'Replay has a close control');
    await click({ name: close.name });
  }
  await click({ text: 'Choose next puzzle' });
  await expect(() => window.__PIECEFUL_UX_STATE__.gallery && !window.__PIECEFUL_UX_STATE__.setup, 'Completion leads to discovery with no hidden preselection');
  await click({ text: 'History' });
  await expect(() => window.__PIECEFUL_UX_STATE__.journal, 'History is reachable from discovery');
  await capture('completed-history');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1800);
  await page.reload();
  await ready();
  assert.equal((await state()).games.length, 1, 'Completed game stays retired after browser reload');
  assert.equal((await state()).content, 'garden');
  assert.equal((await state()).solved, 1, 'Other unfinished progress survives completion persistence');
  assert.equal((await state()).history_count, 1, 'Completion history survives browser reload');
  journeys.push('Completion retirement, history and other progress persist through reload');
  await capture('completion-persisted-gallery');
  await click({ text: 'History' });
  await capture('persisted-history');
  await page.keyboard.press('Escape');
  assert.equal(errors.length, 0, `Browser runtime errors: ${errors.join(' | ')}`);
  await fs.writeFile(`${evidence}/journeys.json`, JSON.stringify({ journeys, screenshots: step, errors, final: await state() }, null, 2));
  console.log(`PASS commercial_product_browser_flow: ${journeys.length} journey assertions, ${step} screenshots, no browser runtime errors`);
} catch (error) {
  console.log('INDEXEDDB', await page.evaluate(() => window.__PIECEFUL_IDB_FAILURES__));
  await fs.writeFile(`${evidence}/failure-state.json`, JSON.stringify(await state(), null, 2));
  await page.screenshot({ path: `${evidence}/failure.png` });
  throw error;
} finally {
  await browser.close();
}
