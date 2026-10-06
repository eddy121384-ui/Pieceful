import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// QA scene only. Layout toggles and post-transition drags use rendered input.
// A deterministic joined fixture uses the board's existing merge machinery.
const url = process.env.PIECEFUL_UX_QA_URL ?? 'http://127.0.0.1:4176/';
const output = process.env.PIECEFUL_TRANSITION_EVIDENCE ?? '/tmp/pieceful-transition-evidence';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.PIECEFUL_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PIECEFUL_CHROMIUM_EXECUTABLE } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const results = [], errors = [];
try {
  for (const pieces of [40, 286]) {
    if (process.env.PIECEFUL_TRANSITION_PIECES && pieces !== Number(process.env.PIECEFUL_TRANSITION_PIECES)) continue;
    for (const [orientation, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
      if (process.env.PIECEFUL_TRANSITION_ORIENTATION && orientation !== process.env.PIECEFUL_TRANSITION_ORIENTATION) continue;
      const label = `${pieces}-${orientation}`;
      console.log('START transition Web runtime', label);
      const context = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
        recordVideo: { dir: `${output}/video`, size: viewport } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      const state = () => page.evaluate(() => window.__PIECEFUL_UX_STATE__);
      async function click(name, text, settle = true) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const current = await state();
          const control = current.controls.find(c => !c.disabled && (name ? c.name === name : c.text === text));
          assert(control, `Rendered control missing: ${name ?? text}`);
          const [x, y, w, h] = control.clip;
          if (w > 20 && h > 30) {
            await page.mouse.click((x + w / 2) * viewport.width / current.viewport[0], (y + h / 2) * viewport.height / current.viewport[1]);
            if (settle) await page.waitForTimeout(650);
            return;
          }
          const [sx, sy, sw, sh] = control.scroll_rect;
          assert(sw && sh, 'Clipped control has no scroll container');
          await page.mouse.move((sx + sw / 2) * viewport.width / current.viewport[0], (sy + sh / 2) * viewport.height / current.viewport[1]);
          await page.mouse.wheel(0, control.rect[1] < sy ? -180 : 180);
          await page.waitForTimeout(300);
        }
        throw new Error('Control remained clipped');
      }
      async function drag(start, end) {
        const current = await state();
        const sx = viewport.width / current.viewport[0], sy = viewport.height / current.viewport[1];
        await page.mouse.move(start[0] * sx, start[1] * sy);
        await page.mouse.down();
        await page.waitForTimeout(300);
        for (let i = 1; i <= 8; i++) {
          await page.mouse.move((start[0] + (end[0] - start[0]) * i / 8) * sx, (start[1] + (end[1] - start[1]) * i / 8) * sy);
          await page.waitForTimeout(80);
        }
        await page.mouse.up();
        await page.waitForTimeout(700);
      }
      const transitions = [];
      async function toggle(tag, joined = false) {
        const before = await state();
        await page.evaluate(() => { window.__PIECEFUL_TRANSITION_FRAMES__ = []; });
        await click('LoosePieceLayoutButton', null, false);
        await page.waitForFunction(() => window.__PIECEFUL_TRANSITION__?.active);
        await page.waitForTimeout(80);
        await page.screenshot({ path: `${output}/${label}-${tag}-during.png` });
        await page.waitForFunction(() => !window.__PIECEFUL_TRANSITION__.active);
        await page.waitForTimeout(250);
        const frames = await page.evaluate(() => window.__PIECEFUL_TRANSITION_FRAMES__);
        assert(frames.length >= 2, 'Actual animated frames were observed');
        let joinedSeen = false;
        for (const frame of frames) {
          assert.equal(frame.root_z, 4096);
          assert(frame.groups.length > 0);
          for (const group of frame.groups) {
            const island = group.holders.length > 1;
            joinedSeen ||= island;
            for (const layers of group.holders) {
              assert.deepEqual(layers.map(layer => layer.name), ['ContactShadow', 'Thickness', 'Face', 'EdgeRelief']);
              assert(layers.every(layer => layer.z === 0 && layer.relative));
              assert.equal(layers[0].visible, !island);
              assert(Math.hypot(...layers[1].offset) > 0, 'Visible cardboard thickness');
              assert.equal(layers[3].material, `PuzzlePieceEdgeRelief_${island ? 'joined' : 'loose'}`);
              assert(layers[3].width > 0, 'Shared shader relief band is present');
            }
          }
        }
        if (joined) assert(joinedSeen, 'Stored joined island animated with joined visuals');
        const after = await state();
        assert(!after.controls.find(c => c.name === 'LoosePieceLayoutButton').disabled);
        assert.equal(after.solved, before.solved);
        if (frames.at(-1).mode === 'scatter') assert(after.piece_points.filter(p => !p.solved).every(p => p.visible && p.pickable));
        transitions.push({ tag, mode: frames.at(-1).mode, frames: frames.length, joinedSeen });
        await fs.writeFile(`${output}/${label}-${tag}-frames.json`, JSON.stringify(frames));
        console.log('PASS animated transition', label, tag, frames.length, 'frames');
      }
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__PIECEPACE_READY__ && window.__PIECEFUL_UX_STATE__?.gallery && !window.__PIECEFUL_UX_STATE__.bootstrapping, null, { timeout: 60000 });
      await page.waitForFunction(() => typeof window.piecefulQaRequest === 'function' && window.__PIECEFUL_PERF_GALLERY_USABLE_MS__ > 0);
      await click('Artwork_garden');
      await page.waitForFunction(() => window.__PIECEFUL_UX_STATE__?.setup);
      if (pieces === 286) {
        await click((await state()).piece_picker);
        const current = await state(), menu = current.menus[0];
        const [x, y, w, h] = menu.rect;
        await page.mouse.click((x + w / 2) * viewport.width / current.viewport[0], (y + 18 + (h - 36) / menu.count * 2.5) * viewport.height / current.viewport[1]);
        await page.waitForTimeout(650);
      }
      await click(null, 'Start puzzle');
      await page.waitForFunction(count => !window.__PIECEFUL_UX_STATE__.gallery && window.__PIECEFUL_UX_STATE__.pieces === count, pieces);
      await page.waitForTimeout(600);
      await toggle('single-to-rail');
      await toggle('single-to-scatter');
      // Pick an island in the first existing dense motion sample, without
      // changing the production sampler or increasing its 18-group limit.
      const anchor = pieces === 286 ? 7 : 0;
      await page.evaluate(index => window.piecefulQaRequest('join_loose', index), anchor);
      await page.waitForTimeout(300);
      const island = (await state()).piece_points.find(p => p.index === anchor);
      await toggle('joined-table-to-rail');
      assert.deepEqual((await state()).piece_points.find(p => p.index === anchor).point, island.point, 'Automatic Rail switch preserves table island');
      await toggle('joined-table-to-scatter');
      assert.deepEqual((await state()).piece_points.find(p => p.index === anchor).point, island.point);
      await toggle('store-preparation-to-rail');
      // Actually drag the connected island into Rail, then animate it back out.
      const stored = await state();
      await drag(stored.piece_points.find(p => p.index === anchor).point, stored.rail_drop_point);
      // CDP mouse-up acknowledges browser delivery, not the next Godot input
      // frame or the fixture's 200 ms state publication. Require the actual
      // release effect; never retry the drag or manufacture a stored cluster.
      const immediatePickable = (await state()).piece_points.find(p => p.index === anchor).pickable;
      const releaseWaitStarted = Date.now();
      await page.waitForFunction(index => window.__PIECEFUL_UX_STATE__?.piece_points
        .find(p => p.index === index)?.pickable === false, anchor, { timeout: 5000 });
      const dropped = await state();
      await fs.writeFile(`${output}/${label}-rail-drop.json`, JSON.stringify({ before: stored, after: dropped,
        immediatePickable, releaseStateWaitMs: Date.now() - releaseWaitStarted }, null, 2));
      assert.equal(dropped.piece_points.find(p => p.index === anchor).pickable, false, 'Real drag stored joined island in Rail');
      await toggle('stored-joined-to-scatter', true);
      const restored = await state(), p0 = restored.piece_points.find(p => p.index === anchor), p1 = restored.piece_points.find(p => p.index === anchor + 1);
      assert.equal(p0.cluster, p1.cluster);
      await page.screenshot({ path: `${output}/${label}-after.png` });
      // Highest loose z is clear of later scatter pieces; real pointer input
      // must still move a piece after the renderer hands interaction back.
      const candidates = restored.piece_points.filter(p => p.visible && p.pickable && !p.solved && p.point[0] > 40 && p.point[0] < restored.viewport[0] - 40 && p.point[1] > 120 && p.point[1] < restored.viewport[1] - 130).sort((a, b) => b.z - a.z);
      assert(candidates.length);
      const piece = candidates[0];
      await drag(piece.point, [piece.point[0] + 35, piece.point[1] + 20]);
      const moved = (await state()).piece_points.find(p => p.index === piece.index);
      assert(Math.hypot(moved.point[0] - piece.point[0], moved.point[1] - piece.point[1]) > 10, 'Post-transition input moves a real piece');
      await toggle('repeat-to-rail');
      await toggle('repeat-to-scatter');
      results.push({ pieces, orientation, viewport, deviceScaleFactor: 3, transitions, postTransitionDrag: true });
      await fs.writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
      await context.close();
      console.log('PASS transition Web runtime', label);
    }
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
} finally {
  await browser.close();
}
