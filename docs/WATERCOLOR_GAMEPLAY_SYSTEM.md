# Watercolor gameplay system pass

Branch: `spike/codex61-watercolor-ui-system-pass`

This builds on `spike/codex61-watercolor-ui` without changing that branch.
The persistent HUD and every related gameplay sheet use ivory paper, sage ink,
quiet wells and fine line marks. The puzzle remains the strongest color on screen.

## Presentation ownership

`watercolor_gameplay_style.gd` owns the shared palette, native surface/control
states, fields, menus, tooltips and scrollbars. It is applied only to gameplay
containers; Gallery and Journal remain outside this pass. Its traversal stops at
Node2D so puzzle faces, depth, shadows, outlines and replay pieces are untouched.

`watercolor_sorting_workspace.gd` adapts the existing analytics sorting workspace.
Canonical membership, drag handlers, reorder/delete/rename bindings, collapse
state, transition policy and Rail/Scatter ordering stay inherited. It composes
compact draggable headers and larger utility targets, skins rebuilt rows and
restores primary icons after inherited refreshes. The manager has an outer scroll
viewport so a short landscape screen retains every action.
On short landscape pages the repeated count and section caption recede so the
first tray row remains visible alongside the main controls. Portrait counts read
as a quiet sentence rather than a legacy workspace diagnostic strip.
Tray and Rail canvas scripts accept an optional StyleBox for their backdrop only. Rail header/side
allowances measure the paper skin and scrollbar thickness; repeated layout no
longer inflates the drawer. The scroll direction and algorithms are unchanged.

Tray manager, playable tray, collapsed tray and Rail use the same paper rim and
well. Empty labels use readable soft ink. Focused name fields have a fine sage
underline; selected tools have a quiet wash; disabled row actions recede without
changing their bindings. Automatic windows clear the header/dock and portrait
Rail. Existing user positioning and original drag coordinates remain supported.

More uses the same icon family and themed difficulty popup. Reference, unfinished
puzzles (including rebuilt save rows), completion and replay also receive paper
surfaces. Completion/replay retain their original content layout and behavior.

## Assets and licensing

The existing `assets/ui/watercolor-gameplay-icons.svg` was expanded from four to
24 original, self-created SVG marks on a 64-unit grid, with consistent 2.4-unit
rounded strokes. It covers primary tabs, More, fit, lines, shuffle, Journal,
unfinished puzzles, create, close, rename, grip, select, reorder, delete,
collapse/expand, send, scatter, return and clear. It is a single lightweight atlas;
no external artwork, raster texture, generated image or new font was imported.
Existing paper/rule shaders and the bundled licensed serif fonts are reused.

## Validation and self-critique

Native runtime inspections cover 390 × 844 portrait and 844 × 390 landscape:
closed HUD, empty/filled manager and tray, collapse, Rail, simultaneous Rail and
manager/More, unfinished puzzles and reference. The system smoke additionally
checks 320 × 568 and repeated layout after rotation, canonical create/rename/
reorder/collapse/delete actions, membership and visible Rail pieces. Required
gesture, pinch handoff, piece depth, overlap and commercial HUD tests are retained
in the branch workflow, along with Rail, completion, replay, Gallery and resume
smokes. CI performs the full Web export and Chromium runtime-ready smoke.

The dark utility surfaces and icon fallback were the largest initial mismatches.
After the first render, Rail header growth and scrollbar assets were corrected;
after the next inspection, floating headers were simplified and icon contrast/
touch sizing were improved. The final system has no dark tray or Rail backing.

Compromises: native flat paper wells are deliberate, keeping texture behind the
puzzle rather than adding visual noise under pieces. Long names truncate in
compact headers (the name field remains editable). Short landscape managers and
More scroll. Overlapping user-opened floating surfaces remain possible by design.
Real iPhone Safari safe areas, keyboard focus and touch comfort still require
device QA; Chromium and native rendering do not certify those behaviors.

The isolated Pages workflow preserves the latest successful Pages artifact and
adds `/previews/codex61-watercolor-ui-system-pass/`. Older publisher workflows can
still replace the site later; this branch does not change their deployment policy.
No merge is part of this pass.
