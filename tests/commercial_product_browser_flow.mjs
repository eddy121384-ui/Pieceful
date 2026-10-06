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

async function drag(start, end) {
  const current = await state();
  const view = page.viewportSize();
  const sx = view.width / current.viewport[0], sy = view.height / current.viewport[1];
  await page.mouse.move(start[0] * sx, start[1] * sy);
  await page.mouse.down();
  await page.waitForTimeout(300);
  for (let move = 1; move <= 12; move++) {
    await page.mouse.move((start[0] + (end[0] - start[0]) * move / 12) * sx, (start[1] + (end[1] - start[1]) * move / 12) * sy);
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);
}

async function continueSavedGame(game) {
  const current = await state();
  const rowIndex = current.games.findIndex(entry => entry.game_id === game);
  const buttons = current.controls.filter(control => control.text === 'Continue' && control.tooltip === 'Continue this saved puzzle');
  assert(rowIndex >= 0 && buttons.length === current.games.length, 'Saved slots match the rendered unfinished rows');
  await click({ name: buttons[rowIndex].name });
  await page.waitForFunction(id => window.__PIECEFUL_UX_STATE__.game === id && !window.__PIECEFUL_UX_STATE__.resume_pending && !window.__PIECEFUL_UX_STATE__.sessions && !window.__PIECEFUL_UX_STATE__.gallery, game, { timeout: 30000 });
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

async function persistedGame(game, solved, retiredGame = '') {
  // waitForFunction treats an async predicate's Promise as truthy even when it
  // resolves false. Await the IndexedDB read in Node, then retry the Boolean.
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const committed = await page.evaluate(async ({ game, solved, retiredGame }) => {
      const databases = await indexedDB.databases();
      for (const info of databases.filter(item => item.name?.startsWith('/userfs'))) {
        const files = await new Promise(resolve => {
          const open = indexedDB.open(info.name);
          open.onerror = () => resolve({});
          open.onsuccess = () => {
            const db = open.result;
            if (!db.objectStoreNames.contains('FILE_DATA')) { db.close(); resolve({}); return; }
            const entries = {};
            const transaction = db.transaction('FILE_DATA');
            transaction.oncomplete = () => { db.close(); resolve(entries); };
            transaction.onerror = transaction.onabort = () => { db.close(); resolve({}); };
            const request = transaction.objectStore('FILE_DATA').openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (!cursor) return;
              const path = String(cursor.key);
              if (path.endsWith(`/saves/${game}.json`) ||
                  path.endsWith('/saves/index.json') ||
                  path.endsWith('/pieceful_journal_v1.json') ||
                  (retiredGame && path.endsWith(`/saves/${retiredGame}.json`))) {
                entries[path] = JSON.parse(new TextDecoder().decode(cursor.value.contents));
              }
              cursor.continue();
            };
          };
        });
        const find = suffix => Object.entries(files).find(([path]) => path.endsWith(suffix))?.[1];
        const saved = find(`/saves/${game}.json`);
        if (saved?.board?.solved_count !== solved ||
            saved.board.pieces.filter(piece => piece.solved).length !== solved) continue;
        if (!retiredGame) return true;
        const index = find('/saves/index.json');
        const history = find('/pieceful_journal_v1.json');
        if (!find(`/saves/${retiredGame}.json`) &&
            index?.games?.length === 1 && index.games[0].game_id === game &&
            history?.completions?.some(record => record.game_id === retiredGame)) return true;
      }
      return false;
    }, { game, solved, retiredGame });
    if (committed) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`IndexedDB did not commit ${game} at ${solved} solved pieces${retiredGame ? ` and retirement of ${retiredGame}` : ''}`);
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
  for (let attempt = 0; attempt < 12 && (await state()).solved < 3; attempt++) {
    const current = await state();
    const candidates = current.piece_points.filter(piece => !piece.solved && piece.visible && piece.point[0] > 60 && piece.point[0] < current.viewport[0] - 60 && piece.point[1] > 150 && piece.point[1] < current.viewport[1] - 180).sort((a, b) => b.z - a.z);
    assert(candidates.length, 'Visible loose pieces remain available for real dragging');
    const piece = candidates[attempt % candidates.length];
    await drag(piece.point, piece.target);
  }
  await expect(() => window.__PIECEFUL_UX_STATE__.solved >= 3, 'Several pieces snap through real drag input');
  assert.equal((await state()).solved, 3);
  await capture('three-real-snaps');
  await click({ name: 'ProductGalleryButton' });
  await expect(() => window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.solved === 3, 'Leave returns to Gallery with progress intact');
  await capture('saved-gallery');
  await persistedGame(firstGame, 3);
  await page.reload();
  await ready();
  assert.equal((await state()).game, firstGame);
  assert.equal((await state()).solved, 3);
  await capture('returning-gallery');
  await click({ prefix: 'Continue ·' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.solved === 3, 'Returning player continues exact saved progress');
  await click({ role: 'picture' });
  await capture('picture-reference');
  const hintBefore = (await state()).hint;
  await click({ role: 'hint' });
  await page.waitForFunction(previous => window.__PIECEFUL_UX_STATE__.hint !== previous, hintBefore);
  journeys.push('Hint assist toggles through its real control');
  await capture('hint-assist');
  await click({ role: 'hint' });
  await click({ role: 'picture' });
  await capture('picture-on-board');
  await click({ role: 'picture' });
  await expect(() => window.__PIECEFUL_UX_STATE__.picture_mode === 'off', 'Picture cycles back to hidden');
  await click({ role: 'trays' });
  await capture('trays');
  await click({ role: 'new_tray_name' });
  await page.keyboard.type('Sky');
  await click({ role: 'create_tray' });
  await expect(() => window.__PIECEFUL_UX_STATE__.tray_detail && window.__PIECEFUL_UX_STATE__.trays.length === 1, 'Trays creates one named tray');
  await click({ role: 'tray_name' });
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Blue sky');
  await click({ role: 'rename_tray' });
  await expect(() => window.__PIECEFUL_UX_STATE__.trays[0].name === 'Blue sky', 'Rename refreshes the tray name');
  await capture('tray-renamed');
  await click({ role: 'collapse_tray' });
  await expect(() => window.__PIECEFUL_UX_STATE__.trays[0].collapsed, 'Tray collapses');
  await capture('tray-collapsed');
  await click({ role: 'collapse_tray' });
  await click({ role: 'close_tray' });
  const trayState = await state();
  const source = trayState.piece_points.filter(piece => !piece.solved && piece.visible && piece.point[1] > 160 && piece.point[1] < 400).sort((a, b) => b.z - a.z)[0];
  const target = trayState.controls.find(control => control.text === 'Blue sky · 0');
  assert(source && target, 'A loose piece and a rendered tray drop target are available');
  await drag(source.point, [target.clip[0] + target.clip[2] / 2, target.clip[1] + target.clip[3] / 2]);
  await expect(() => window.__PIECEFUL_UX_STATE__.trays[0].members.length > 0, 'Real drag stores a piece in the named tray');
  await capture('piece-in-tray');
  await click({ text: 'Blue sky · 1' });
  await capture('playable-tray');
  await click({ role: 'close_tray' });
  await click({ role: 'close_trays' });
  const pieces = (await state()).controls.find(control => /LoosePieceLayoutButton/.test(control.name));
  assert(pieces, 'Pieces control is present');
  await click({ name: pieces.name });
  await capture('pieces-strip');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(1200);
  await capture('narrow-gameplay-rail');
  await click({ name: 'AlbumMore' });
  await capture('narrow-more-tools');
  await click({ text: 'Board lines' });
  await expect(() => window.__PIECEFUL_UX_STATE__.board_lines && window.__PIECEFUL_UX_STATE__.board_lines_visible, 'Accepted Board Lines enable');
  await page.keyboard.press('Escape');
  await capture('narrow-board-lines-on');
  await click({ name: 'AlbumMore' });
  await click({ text: 'Board lines' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.board_lines && !window.__PIECEFUL_UX_STATE__.board_lines_visible, 'Board Lines OFF removes the overlay completely');
  await click({ text: 'Fit workspace' });
  await capture('narrow-fit');
  await click({ name: 'AlbumMore' });
  await selectOption('AlbumDifficultySelect', 1, 'narrow-piece-count-popup');
  await expect(() => window.__PIECEFUL_UX_STATE__.confirmation, 'Changing piece count asks before starting another puzzle');
  await capture('narrow-piece-count-confirmation');
  await click({ text: 'Keep playing' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.confirmation && window.__PIECEFUL_UX_STATE__.difficulty === 'relaxed' && window.__PIECEFUL_UX_STATE__.solved === 3, 'Cancel piece-count change preserves exact puzzle state');
  await capture('more-tools');
  await click({ text: 'Reshuffle pieces' });
  await expect(() => window.__PIECEFUL_UX_STATE__.confirmation, 'Reshuffle shows a consequence-aware confirmation');
  await capture('reshuffle-confirmation');
  await page.keyboard.press('Escape');
  await expect(() => !window.__PIECEFUL_UX_STATE__.confirmation && window.__PIECEFUL_UX_STATE__.solved === 3, 'Cancel preserves placed pieces');
  await page.keyboard.press('Escape');
  await click({ name: 'ProductGalleryButton' });
  await capture('narrow-gallery');
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
    assert.equal((await state()).solved, 3);
    await capture('photo-setup-safe');
    await click({ text: 'Back to Gallery' });
  }
  await click({ text: 'Settings' });
  await expect(() => window.__PIECEFUL_UX_STATE__.settings, 'Settings is reachable independently of discovery');
  await capture('narrow-settings');
  await page.keyboard.press('Escape');
  await click({ text: 'History' });
  await capture('narrow-empty-history');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
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
  await selectOption('GalleryStatusFilter', 3, 'status-popup');
  assert((await state()).controls.some(control => control.name === 'Artwork_garden'));
  assert(!(await state()).controls.some(control => control.name === 'Artwork_twilight_lake'));
  journeys.push('In progress filter reflects actual unfinished content');
  await capture('in-progress-filter');
  await selectOption('GalleryStatusFilter', 5);
  assert(!(await state()).controls.some(control => control.name === 'Artwork_garden'));
  assert((await state()).controls.some(control => control.name === 'Artwork_twilight_lake'));
  journeys.push('New filter excludes unfinished content');
  await capture('new-filter');
  await click({ text: 'Browse' });
  await click({ name: 'Artwork_twilight_lake' });
  await click({ text: 'Start puzzle' });
  await expect(() => window.__PIECEFUL_UX_STATE__.content === 'twilight_lake' && !window.__PIECEFUL_UX_STATE__.gallery, 'Switching starts a separate puzzle');
  assert.equal((await state()).games.length, 2);
  const secondGame = (await state()).game;
  await click({ name: 'ProductGalleryButton' });
  await click({ prefix: 'All unfinished puzzles' });
  await expect(() => window.__PIECEFUL_UX_STATE__.sessions, 'All unfinished puzzles is a direct discovery destination');
  await capture('unfinished-puzzles');
  await continueSavedGame(firstGame);
  assert.equal((await state()).content, 'garden');
  assert.equal((await state()).solved, 3);
  assert((await state()).piece_points.filter(piece => piece.solved).every(piece => piece.visible), 'Restored solved pieces remain visible in rail mode');
  journeys.push('Unfinished list restores the original puzzle after starting another');
  await capture('original-puzzle-resumed');
  await click({ name: 'ProductGalleryButton' });
  await click({ prefix: 'All unfinished puzzles' });
  await continueSavedGame(secondGame);
  assert.equal((await state()).content, 'twilight_lake');
  assert.equal((await state()).solved, 0);
  journeys.push('Unfinished list switches back to the separate newer puzzle');
  await click({ name: 'ProductGalleryButton' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1200);
  await capture('landscape-gallery');
  await click({ name: 'Artwork_garden' });
  await expect(() => window.__PIECEFUL_UX_STATE__.setup, 'Landscape discovery can reach artwork setup');
  await capture('landscape-setup');
  await click({ text: 'Back to Gallery' });
  await click({ prefix: 'Continue ·' });
  await capture('landscape-gameplay');
  await click({ role: 'trays' });
  await capture('landscape-trays');
  await click({ role: 'close_trays' });
  await click({ name: 'AlbumMore' });
  await capture('landscape-more');
  await click({ text: 'Board lines' });
  await expect(() => window.__PIECEFUL_UX_STATE__.board_lines_visible, 'Board Lines enable in short landscape');
  await page.keyboard.press('Escape');
  await capture('landscape-board-lines-on');
  await click({ name: 'AlbumMore' });
  await click({ text: 'Board lines' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.board_lines_visible, 'Board Lines OFF removes them in short landscape');
  await selectOption('AlbumDifficultySelect', 1, 'landscape-piece-popup');
  await expect(() => window.__PIECEFUL_UX_STATE__.confirmation, 'Short landscape piece-count confirmation is reachable');
  await capture('landscape-confirmation');
  await click({ text: 'Keep playing' });
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.piecefulQaRequest('complete'));
  await expect(() => window.__PIECEFUL_UX_STATE__.completion && window.__PIECEFUL_UX_STATE__.solved === window.__PIECEFUL_UX_STATE__.pieces, 'Real solved-cluster completion enters result flow');
  await capture('completion');
  const downloadPromise = page.waitForEvent('download');
  await click({ name: 'CompletionShareResult' });
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const png = await fs.readFile(downloadPath);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.match(download.suggestedFilename(), /\.png$/);
  journeys.push('Share result downloads a valid PNG through the actual Web fallback');
  await capture('share-result');
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
  await click({ prefix: 'Continue ·' });
  await expect(() => !window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.content === 'garden' && window.__PIECEFUL_UX_STATE__.solved === 3, 'Completion can resume another unfinished puzzle immediately');
  assert((await state()).piece_points.filter(piece => piece.solved).every(piece => piece.visible), 'Completion-to-resume shows the saved solved pieces');
  await capture('resumed-after-completion');
  await click({ name: 'ProductGalleryButton' });
  await persistedGame(firstGame, 3, secondGame);
  await page.reload();
  await ready();
  assert.equal((await state()).games.length, 1, 'Completed game stays retired after browser reload');
  assert.equal((await state()).content, 'garden');
  assert.equal((await state()).solved, 3, 'Other unfinished progress survives completion persistence');
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
