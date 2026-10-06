# Gameplay-reachable watercolor UI audit

Branch: `spike/codex61-watercolor-ui-system-pass`.
Scope: gameplay and every app-owned destination reachable from it. Presentation
only; gameplay, renderer, gesture, persistence, Gallery, Journal and catalog
models remain unchanged. No merge.

## Discovery and completion checklist

Traced `main.tscn` through the complete commercial → monetization → analytics →
video export → replay → share → Journal → completion → photo → Gallery →
selection → saved-games → spatial gameplay → main inheritance chain, plus the
SortingWorkspace inheritance chain. Searched scripts and scenes for CanvasLayer,
Window, PanelContainer, PopupMenu, OptionButton, dialog constructors, visibility
changes and dynamically created controls. Included startup/resume/import,
completion, offscreen share rendering and both recording-layout transitions.

The saved-games panel itself was paper at the baseline. Its **Start new** route
opened the inherited black Gallery with search and filters. That full route is
now covered, including its open menus. Framework-created search context submenus
were also discovered and opened. No app-owned confirmation dialog or file-picker
dialog exists on these routes; photo picking and sharing use platform UI.
Separate Web lab/demo pages have no gameplay navigation path and are excluded.

P/L below means actual Godot Web runtime visually opened at **390×844 portrait**
and **844×390 short landscape**, with rotation between them. This is Chromium
viewport QA, not iPhone Safari certification. Source names below are in `scripts/`.
All listed app-owned surface families have been inspected; no known reachable
legacy dark surface remains.

| Surface / state | How reached | Implementation | Initial visual status / dark legacy? | Final action | QA |
|---|---|---|---|---|---|
| Gameplay / HUD / dock / board mount / selected and disabled controls | Normal play | commercial_gameplay_hud_main.gd | Accepted paper; no | Preserve art direction | Web P/L; gameplay regressions |
| Tray manager / list / rename / multi-select / contextual clear and row actions | Dock Trays; select a piece | watercolor_sorting_workspace.gd | Accepted paper; no | Preserve styling of rebuilt controls | Web P/L; selected-count and rename opened; create/reorder/delete/scroll regressions |
| Playable trays / empty / filled / collapsed | Create or open tray; header toggle | tray_play_canvas.gd, watercolor_sorting_workspace.gd | Accepted paper; no | Preserve paper well and fine-line controls | Web P/L; empty, filled, rename, collapse and expansion |
| Rail / scrolling / Rail with manager or More | Dock Pieces | loose_piece_rail_canvas.gd, watercolor_sorting_workspace.gd | Accepted paper; no | Preserve presentation and behavior | Web P/L, filled Rail and overlapping UI |
| More / scrolling / Fit / Reshuffle / Board Lines | HUD ellipsis | commercial_gameplay_hud_main.gd | Accepted paper; no | Preserve quiet hierarchy | Web P/L; open, scrolled, Fit and lines on/off; shuffle binding regression |
| Gameplay difficulty OPEN popup | More → difficulty | commercial_gameplay_hud_main.gd | Paper parent; open coverage incomplete | Explicit paper popup and larger menu rows | Web P/L OPEN |
| Reference off / thumbnail / drag / board ghost | Dock Reference cycles | main.gd, draggable_reference_panel.gd | Accepted paper; no | Preserve behavior | Web modes and thumbnail drag; portrait capture |
| Hint selected / disabled / active wash | Dock Hint | main.gd | Accepted paper; no | Preserve behavior | Web active wash; disabled completion state; HUD regressions |
| Unfinished empty / current / populated / resume / row actions | More → Unfinished | multi_slot_chaos_order_spatial_main.gd, puzzle_selection_multi_slot_main.gd | Paper, but could open UNDER tray manager | Refine title and Start new; give saved-games panel its own UI layer | Web empty and populated/current; resume route; P/L; over-tray failure reproduced and fixed |
| Gallery / selection / For You / favorite / filter / no results / scroll | Unfinished → Start new; completion → Browse or recommendation | gallery_image_aware_main.gd, puzzle_selection_multi_slot_main.gd | **Black modal, gray controls, old hierarchy** | Paper editorial sheet, artwork-first cards, scroll body, fixed difficulty/actions, explicit no-results copy | Web P/L; both entry routes; favorite wash, filters, empty and scrolling; selection/save tests |
| Gallery theme / status / difficulty OPEN popups | Gallery filters and footer | gallery_image_aware_main.gd, image_aware_puzzle_selection_main.gd | **Default dark menus** | Theme detached popup windows explicitly; constrain height | Web all three OPEN; portrait and landscape menus captured |
| Search focus / clear / context menu / nested text-direction menu | Gallery search, right click | gallery_image_aware_main.gd, watercolor_gameplay_style.gd | **Default menu and legacy field** | Paper field, visible ink clear mark, shared context/submenu theme | Web OPEN context and nested menu; search empty and clear |
| Photo / Puzzle Me entry / privacy / ready / error / local cards | Gallery → Choose a photo | puzzle_me_main.gd, puzzle_me_responsive_main.gd | **Dark inherited parent and old controls** | Same sheet, camera mark, wrapped privacy and error copy | Web public sample-photo import, ready, seeded error; photo/Gallery regressions |
| Startup / resume / photo preparation curtain | Load / Resume / photo import | startup_gated_gallery_main.gd | **Black opaque curtain, recreated later** | Paper presentation applied on every recreation | Actual startup and Resume route; seeded preparation curtain; startup smoke |
| Journal empty / Today / Week / recent cards / list scrolling | More → Puzzle Journal | puzzle_journal_main.gd | **Black modal, dark cards, old close mark** | Paper editorial sheet, light summary wells/cards and shared close mark | Web empty and populated; list scroll; P/L; Journal tests |
| Completion / recommendations / share preparation / disabled actions | Finish puzzle | completion_summary_main.gd, completion_share_card_main.gd | Paper card but tiny inherited controls; HUD could draw OVER card | Scrollable artwork/facts, fixed larger actions, matching utility marks, correct UI layer | Web seeded completion P/L; Browse and recommendation routes; facts scroll; completion tests |
| Generated result PNG | Completion → Share result | completion_share_card_contain_main.gd | **Black card, white typography** | Paper artwork mount and ink typography | Actual Web-rendered 1080×1350 PNG saved and inspected; share-card tests |
| Replay / playback / Replay again / unavailable state | Completion → Replay | timelapse_replay_main.gd | Paper initially; tiny controls and dock overdraw | Larger readable controls; dedicated paper replay layer | Web P/L playback and Replay again; seeded missing-trace/disabled action; replay tests |
| Video recording / ready / error / restored layout | Replay → Export | timelapse_video_export_main.gd | **Black reset during recording AND restoration** | Reapply paper after both inherited layout methods | Actual Web recording and ready/return; seeded error; export tests |
| Ads status / Remove ads / Restore disabled states | Gallery For You | monetization_main.gd | **Legacy controls and faded copy** | Shared field/button/type system; preserve provider availability | Web preview/disabled states; native provider UI requires platform QA |
| Tooltips / focus / scrollbar tracks and grabbers | Throughout sheets, fields and menus | watercolor_gameplay_style.gd | Partial inherited coverage | Shared paper/ink theme on all reachable controls | Web focus/scroll; menu and UI regression checks |
| Web loader / failure notice / engine boot | Initial Web page before gameplay | tools/instrument_web_loader.py, project.godot | **Black Web page, default engine splash, developer download metrics** | Ivory page and engine clear/splash; Pieceful wordmark, quiet progress/copy, paper notice | Actual Web loader/startup visually inspected; loader/readiness browser smoke |
| Browser/OS picker, native share/download, purchase provider UI | Photo / Share / native monetization | DisplayServer / JavaScriptBridge / provider | Platform-owned | Intentionally unchanged | Browser photo chooser exercised; iPhone/native platform QA outstanding |

## Runtime evidence

PNG captures are retained locally in `build/qa-web-captures/` (ignored; not shipped
as game assets). Important captures:

- `portrait-gameplay-final.png`, `portrait-tray-filled-renamed.png`,
  `portrait-tray-collapsed-final.png`, `portrait-tray-multi-select.png`
- `portrait-rail-final.png`, `portrait-more-final.png`,
  `portrait-gameplay-difficulty-menu.png`
- `portrait-unfinished-final.png`, `landscape-unfinished-over-tray.png`,
  `portrait-gallery-from-unfinished.png`
- `portrait-category-menu.png`, `portrait-status-menu.png`,
  `portrait-selection-difficulty-menu.png`, `portrait-search-context-menu.png`,
  `portrait-nested-menu.png`, `portrait-search-empty-clear.png`
- `portrait-photo-entry.png`, `portrait-photo-error.png`, `portrait-photo-ready.png`
- `portrait-journal-populated.png`, `portrait-journal-scroll.png`, `landscape-journal.png`
- `portrait-completion.png`, `landscape-completion.png`,
  `landscape-completion-scroll.png`, `result-share-card.png`
- `landscape-replay.png`, `landscape-video-recording.png`, `landscape-video-ready.png`,
  `portrait-video-error.png`, `landscape-video-error.png`, `portrait-loading-curtain.png`
- `landscape-gallery.png`, `landscape-status-menu.png`, `landscape-gallery-empty.png`,
  `landscape-tray-expanded-rail.png`, `landscape-more-scroll.png`

Normal gameplay, menus, selection, favorite/search, photo import, saved-game
navigation and resume were operated through the Web UI. An **ignored QA-only copy
of the project** adds keyboard fixtures to populate a tray/Journal, present a
valid completion/replay record and hold short-lived loading/error/unavailable
states for inspection, and to save Web framebuffer captures. It is not part of
this branch's production export. Completion QA therefore does not claim a full
40-piece solve on a real device. The generated share PNG and video recorder still
use the application's actual rendering/export implementations.

## Regression coverage

`watercolor_reachable_ui_smoke.gd` follows actual More → Unfinished → Start new
button bindings; checks detached menu surfaces, menu touch spacing, Japanese
catalog glyph, search no-results/clear layout, modal layers, loading recreation,
recording/restoration, fixed completion actions, and sheet/replay bounds in both
orientations. Existing model and gameplay tests remain intact.

Bounds QA opens the actual Gallery and Journal overlays before measurement.
The first CI attempt exposed a test-fixture error: showing only a panel under
a hidden overlay leaves wrapped labels unlaid out. This was reproduced with
the preceding sorting test's saved state; opening the real overlays restored
correct bounds (672×1100 portrait, 900×672 landscape). The corrected test keeps
all viewport assertions and checks that the panels are visible in the tree.

The branch workflow runs 21 Godot smokes: commercial HUD, watercolor system,
reachable UI, Rail layout, completion presentation/share, replay/video export,
touch arbitration, pinch handoff, piece depth, overlap z-order, Gallery flow and
portrait layout, selection, Journal UI, photo flow, multi-slot save, save
robustness, content identity and startup/resume. It then performs a full Web
export and mobile Chromium runtime-ready/build-SHA smoke, including loader
colors/branding. Local required and touched-presentation checks passed; exact
CI/deployment results are supplied with the delivery.

## Assets, preserved surfaces and remaining limits

- Expanded the existing self-created SVG atlas from 24 to 26 marks: matching
  fine-line heart and camera. No raster UI assets were added.
- Added a 3,308-byte font subset for the catalog's `箏` glyph, renamed Pieceful
  Catalog Ink, derived from Noto Sans JP under SIL OFL 1.1. Full license and source,
  SHA and subset provenance are in `assets/ui/CATALOG-INK-*`. Existing serif fonts
  and paper/wash shaders are reused.
- Accepted HUD, board mount, Tray, Rail, More, Reference and Hint presentation is
  retained; shared menu typography/spacing and display layering were improved.
- All gameplay/data/business models and piece renderer remain untouched. Native
  OS/provider surfaces and unreachable development/demo pages are intentionally
  outside the app-owned presentation pass.

Self-critique: the inherited black Gallery, Journal, loading curtain, result PNG
and recording/restoration resets were the major failures. Runtime iteration also
caught undersized completion/replay type, a low-contrast search clear mark,
missing catalog glyph, HUD/dock overdraw and saved-games-under-tray ordering.
Those issues were corrected and reopened. No known app-owned dark utility surface
remains on the audited routes.

Remaining limits: short landscape intentionally scrolls content while keeping
primary actions fixed; long catalog/recommendation names may truncate with
existing tooltips. The small font subset covers the current catalog glyph, not a
complete Japanese localization. Native pickers/share/purchases retain platform
appearance. Real iPhone Safari safe areas, keyboard, touch comfort and video/share
capabilities still require the requested real-device QA. Nothing is merged.
