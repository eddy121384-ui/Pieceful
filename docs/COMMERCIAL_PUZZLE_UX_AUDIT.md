# Pieceful commercial product UX audit

Audit date: 2026-10-01. Base: `spike/codex61-watercolor-ui-system-pass`,
`2cbc4a12038faa00793db57801b81f82053ba1ba`.
Implementation: `spike/codex61-commercial-product-ux-pass`; accepted watercolor
branch stays unchanged. This is a product navigation pass, awaiting real iPhone QA.

## 1. Benchmark observations and evidence limits

Attempted current first-party research for [Easybrain Jigsaw Puzzles](https://easybrain.com/jigsaw-puzzles),
[Jigsawscapes](https://www.jigsawscapes.com/), [Magic Jigsaw Puzzles](https://zimad.com/games/magic-jigsaw-puzzles/),
and [MobilityWare Jigsaw Puzzle](https://www.mobilityware.com/jigsaw-puzzle/).
The cloud network returned HTTP 403 for these destinations. No competitor app
was installed or observed; this report does **not** claim verified current
competitor screen sequences, pricing, retention performance, or comparative usability.

The usable benchmark is established mobile puzzle/product practice, tested
against Pieceful's running interface: separate finding a picture from deciding
how to play it; make a saved game's continuation immediately available; keep
solving tools near the board; ask before losing work; put purchase restoration
in Settings; make the completed puzzle lead naturally to another picture.
These are design hypotheses rather than findings about those four apps.

The repository's [market research note](MARKET_AND_COMPETITORS_ZH.md), dated
2026-08-31, supplies secondary background: Easybrain emphasizes categories
and hints; Magic Jigsaw includes player-photo puzzles and difficulty choices;
Jigsawscapes emphasizes themes/offline play and varied piece counts. Those
are the note's attributed feature claims, not reverified current interfaces.
They support keeping discovery, piece-count setup and private photos clear;
they do not establish exact screen placement or a reason to add their events,
quests or communities. The [product direction](PRODUCT_DIRECTION_ZH.md)
already specifies Home → picture → piece count → play → autosave → completion
and the promise “No ads while you puzzle”; the implementation restores that
coherent loop rather than introducing a different commercial strategy.

No streaks, daily rewards, currency, push prompts, intrusive tutorials, or extra
monetization were added. Their presence in another commercial app would not
justify adding them to Pieceful.

Evidence comes from Chromium on actual exported Godot scenes, repository
behavior, and native regression tests. Screenshots in `ux-evidence/before/`
were captured from the accepted base in this session. The final screenshots
are from the implemented branch, not mockups. Baseline completion behavior
was inspected in source and tests; it is not presented as an observed baseline
completion screenshot. There was no participant study, analytics frequency
dataset, VoiceOver test, or physical iPhone test. Frequency below is expected
frequency within a puzzle journey, not measured user behavior.

## 2. Current player journey

In the clean baseline browser run, launch revealed the provisional Garden
board at 0/40. A player could solve immediately but could not first choose the
picture or understand how to find another one. Native selection tests do open
the chooser; startup was therefore inconsistent across evidence sources.

To choose another puzzle, the observed route was More → Unfinished puzzles →
Start new → Gallery. Gallery combined a picture grid, search, theme/status
filters, For You copy, photo import, recommendation reset, and a permanent
piece-count/Start footer. The footer could start a previously/default selected
picture even after that picture scrolled out of view.

Gameplay's Trays, Pieces, Reference and Hint were appropriately permanent.
More mixed puzzle operations (Fit, Board lines, Reshuffle, difficulty) with
destinations (Unfinished puzzles, Journal). Journal did not explain its purpose
in the language of completed puzzles. Saved-game rows disabled their active
game's Open action, despite a player being in the saved-game list.

Source/tests showed the completed puzzle had Share, replay/export,
recommendations and Browse all, but the continuation action did not clearly
communicate that it was the primary destination after completion.

| Baseline evidence | Observation |
| --- | --- |
| [Launch](ux-evidence/before/01-first-launch.png) | Gameplay opens without a discovery destination |
| [More](ux-evidence/before/02-more.png) | Solving tools and content/history navigation compete |
| [Unfinished](ux-evidence/before/03-unfinished.png) | Choosing a new picture is behind saved-game management |
| [Gallery](ux-evidence/before/04-gallery.png), [difficulty](ux-evidence/before/06-difficulty.png) | Discovery and setup occupy the same sheet |
| [Reference](ux-evidence/before/09-reference.png), [Trays](ux-evidence/before/10-trays.png), [Pieces](ux-evidence/before/11-pieces.png) | Mature solving tools worth preserving |
| [Journal](ux-evidence/before/12-history.png) | History is a remote destination, with an empty first-session state |

## 3–4. Problems, severity and frequency

Severity: critical = progress cannot be trusted; high = blocks or obscures a
core journey; medium = recurring ambiguity/friction; low = polish or uncommon
friction. This is a small-team priority assessment, not a numerical usability score.

| ID | Problem and evidence | Severity | Expected frequency | Resolution |
| --- | --- | --- | --- | --- |
| P01 | Discovery is behind gameplay overflow and saved-game management; launch/More/Unfinished screenshots | High | Every new or switching player | Gallery at launch and an explicit gameplay Gallery action |
| P02 | Start belongs to a selection that can be off-screen; Gallery/difficulty screenshots | High | Every new puzzle | Picture → dedicated setup → Start |
| P03 | Saved progress lacks a prominent returning-player action; baseline route/source | High | Every return | Continue banner with picture and saved piece count; direct unfinished list |
| P04 | Reshuffle and saved-game deletion execute without consequence-specific decisions; source and tests | High | Occasional, high consequence | Confirm or cancel before mutation |
| P05 | Photo import changes the live content identity before Start; source and focused save test | Critical | Each photo import with another puzzle open | Restore live content identity before yielding; imported picture remains only a candidate |
| P06 | Exported artwork is visible but original image bytes are absent, so content hashes cannot be saved; actual final-branch Chromium run exposed `Current puzzle content identity is unavailable` | Critical | Every Web save | Include original catalog SVG/JPEG bytes in export packages; retain identical identity/hash contract |
| P07 | More mixes discovery/history with solving tools; More screenshot | Medium | Frequent navigation | Promote destinations to Gallery; keep compatibility shortcuts in More |
| P08 | Favorites/photo entry and reset/commerce share discovery space; Gallery source | Medium | Regular discovery, rare reset/commerce | Named collections; Settings owns reset and purchase restoration |
| P09 | Active saved-game row has a disabled Open action; source | Medium | Returning to unfinished list | Continue works for the active game without reloading it |
| P10 | Completion offers several actions without a clear next destination; source/tests | Medium | Every completion | Primary Choose next puzzle; share/replay/recommendations stay available |
| P11 | Paper styling can reveal the gallery again inside setup; implementation screenshot review | High | Every picture selection | Reapply product visibility after shared presentation/orientation callbacks |
| P12 | Reference/Rail/Journal terminology reveals internal models | Medium | Frequent control use | Picture, Pieces, Puzzle history; retain familiar Trays with explanatory tooltips |
| P13 | Short landscape Gallery loses its pictures beneath fixed resume/navigation blocks; actual branch screenshot review | High | Every landscape return | Resume/collections join the discovery scroll body; setup/actions remain reachable |
| P14 | Replay footer exposes semantic event counts and Chaos/Order internals; actual replay screenshot | Low | Each replay | Player-facing replay phase/footer copy, unchanged replay reconstruction |
| P15 | Completing a game removes its save while Godot's Web sync still holds an earlier filename list, producing ENOENT/errno 44 | Critical | Completion/delete during a pending Web sync | Enumerate IndexedDB first, then synchronously enumerate/read current local files |

P06 is an export-packaging defect discovered while validating this product
pass. It cannot be fixed by a reassuring label: a reload must actually restore
the same saved game and placed pieces. An enabled editor export plugin adds raw catalog artwork bytes for all
existing export presets because the same identity code is shared by Web and
mobile. No renderer or save-schema rewrite was necessary.

P15 was reproduced in a minimal running browser completion case and traced to
the exact retired `user://saves/game_….json` path. The Godot 4.7.2 Emscripten
IDBFS helper enumerated local files, awaited the remote IndexedDB listing, then
read files that gameplay could delete during that await. The Web postprocessor
now reverses those two enumeration calls. Local enumeration and reads then
occur in the same JavaScript turn. It does not copy every photo buffer, swallow
errors, change the save format, or change the game's completion/deletion rules.
The patch fails closed if a future Godot helper differs and needs review.

## 5–6. Function inventory: current and proposed information architecture

Functions are inventoried by player purpose. Some span two categories; their
placement follows the moment when they help the player, not the owning script.

| Function | Classification | Accepted placement | Implemented placement/priority |
| --- | --- | --- | --- |
| Drag, snap/merge, pan, pinch | Primary | Puzzle workspace | Unchanged workspace and gesture internals |
| Picture/reference modes, floating reference movement | Primary | Reference dock; three-mode cycle | Picture dock; existing cycle and movable reference retained |
| Hint assist | Primary | Dock | Dock, existing assist behavior unchanged |
| Loose-piece table/strip, rail scrolling | Primary | Pieces dock | Pieces dock; rail stays an implementation term |
| Trays, piece transfer, multi-select | Primary/contextual | Trays manager/workspace | Existing Trays and selection context |
| Add, name/rename, delete, reorder/collapse trays | Contextual | Trays manager | Retained inside manager; no global toolbar additions |
| Progress and current difficulty | Primary feedback | Gameplay header | Same header, compact alongside Gallery and More |
| Fit workspace | Secondary | More | More; no permanent space taken from puzzle tools |
| Board lines | Secondary | More | More, existing toggle |
| Reshuffle | Contextual/high consequence | More, immediate mutation | More → explicit consequence confirmation |
| Change piece count during play | Contextual | More difficulty selector | More → confirm separate puzzle; current save remains |
| Gallery / browse pictures | Content/discovery | Start new through saved-game panel | Default entry and gameplay Gallery button |
| Search, themes, status filters | Content/discovery | Gallery | Browse; no filter chrome inside setup |
| For You and local recommendations | Content/discovery | Duplicate Gallery recommendations block + filter + completion | For You filter and completion recommendations; duplicate text block hidden |
| Artwork title, thumbnail, artist/theme metadata, status | Content/discovery | Cards | Existing cards; selected title/image repeated clearly in setup |
| Favorite/unfavorite | Content/discovery | Card heart and status filter | Same heart plus top-level Favorites collection |
| Piece-count choice and preferred difficulty | Contextual | Permanent Gallery footer | Setup after picture choice; existing preference remembered |
| Start first/new puzzle | Contextual | Permanent Start | Setup; Start another clearly preserves an unfinished game |
| Continue selected picture | Contextual | Card Continue | Card Continue retained; setup also offers Continue saved puzzle |
| Continue most relevant saved game | Content/discovery | Automatic startup/unfinished list | Returning Gallery banner, active game preferred |
| All unfinished games, resume/delete | Content/discovery | More → saved panel | Gallery → unfinished list; old More shortcut retained; deletion confirmed |
| My Photo/Puzzle Me import | Content/discovery/system | Below Gallery content | My photos → Choose a photo → setup; local import/storage retained |
| Completed images/history, today/week statistics | Meta/history | More → Journal | Gallery History → Puzzle history; old Journal binding retained |
| Completion result, assisted status, time/piece count | Contextual/meta | Completion sheet | Same result sheet, no new reward layer |
| Next picture, recommended picture | Content/discovery/contextual | Browse all and recommendations | Primary Choose next puzzle; recommendation opens setup |
| Share card/download, replay, replay again, video export | Contextual/system | Completion/replay | Retained completion/replay tools, subordinate to next puzzle |
| Reset recommendation profile | System | Gallery recommendations | Settings → confirmation; favorites/history/saves retained |
| Remove Ads, restore entitlement, provider status | System | Gallery commerce row | Settings with existing provider bindings; unsupported Web commerce hidden |
| Privacy/data locality and monetization boundary copy | System | Photo and purchase copy | Photo/Settings copy; no ad interruption during solving |
| Back/close/cancel, platform back | Contextual navigation | Several independent close/cancel patterns | Close topmost sheet; setup → Gallery; Gallery → current game; gameplay → Gallery |
| Save/load failures, unavailable content | System/contextual | Existing error labels/loading gate | Existing gates/errors retained; leaving blocked if save fails |

Conceptual hierarchy:

```text
Gallery
  Continue current / recent saved puzzle → Gameplay
  All unfinished puzzles → Continue / confirm Delete
  Browse → Search + themes + status (including For You)
  Favorites / My photos
  Picture → Setup: image + piece count → Start / Continue saved
  History → completed puzzle records
  Settings → recommendation reset / supported purchase restoration

Gameplay
  Gallery + progress/difficulty + More
  Trays / Pieces / Picture / Hint
  More → Fit / Board lines / confirm Reshuffle / confirm new piece count
  Completion → Choose next puzzle; Share / Replay / recommendations
```

## 7–8. Changes and rationale

**Discovery and setup are different decisions.** Browse no longer carries a
Start button for a hidden default picture. A picture tap opens its own large
image, title and piece-count choice. Back cancels the choice without changing
the live board. The existing difficulty preference is reused; no new difficulty
schema or additional required step was introduced.

**Returning players get a concrete promise.** Continue names the picture and
shows saved placed pieces. Leaving gameplay saves before showing Gallery.
The active game's Continue reveals the same board; another game's Continue
uses the existing loading curtain and restoration path. Starting another
picture or count keeps the previous slot. No provisional technical save is
advertised as player progress.
Both Continue paths restore the puzzle-session monetization boundary and emit
one resume event, including an already restored board after returning launch.

**One destination for each purpose.** Favorites and My photos have explicit
collection entries. Search/themes/status live in Browse. Local recommendation
reset and commerce move to Settings. For You's existing filter and completion
recommendations retain personalization without a repeated text-button block.
Unfinished puzzles and History are reachable from discovery. Legacy overflow
shortcuts stay available so nothing silently disappears.

**High-consequence operations name their effects.** Reshuffle explains that
placed/joined pieces return to the table. Changing count explains that a new
puzzle is created. Deleting a saved game and resetting recommendations have
separate, precise prompts. Cancel never mutates progress or preferences. The
active save cannot be deleted, matching the mature save coordinator's rule.

**Tools stay near the puzzle.** The four solving controls remain; Fit, Board
lines and reshuffle remain in More. Existing tray operations remain contextual.
Picture communicates a familiar player object. Puzzle history communicates
Journal's purpose. A full-screen overflow input scrim prevents a tap outside
More from accidentally moving the underlying puzzle. Discovery now has one
vertical scrolling surface in portrait; the returning-player banner and
collections scroll with content so they cannot consume the landscape sheet.

**Completion has a continuation.** Choose next puzzle is the primary action;
replay, export/share and recommendations keep their real bindings. A
recommendation opens piece-count setup rather than silently replacing the
board. Replay describes starting/placing pieces and the next available
actions, rather than showing internal event counters. No artificial retention
mechanics were added.

New sheets use the accepted paper/sage/charcoal palette, serif headings,
quiet spacing and restrained borders. Core shaders, geometry, shadows,
touch arbitration, hit regions, z-order, camera and snap/merge code are
unchanged. Gameplay-adjacent changes are the photo candidate identity guard
and the export/persistence fixes required for truthful save/resume behavior.
The renderer/WASM and mature puzzle interaction code are preserved.

## 9. Final journeys and runtime verification

New player: loading gate → Gallery → picture → pieces → Start → solve/tools →
Gallery with saved progress → Continue → completion → Choose next puzzle.

Returning player: loading/restoration gate → Gallery with Continue → exact
saved puzzle → choose another picture → separate saved game → unfinished
list → return to original progress.

Discovery: Browse/search/themes/status → favorite → Favorites; My photos →
platform file picker → imported candidate setup → Start or Back; Settings and
History close to the previous destination.

Implementation checks and accepted screenshots from the final runtime pass
are recorded below. The browser fixture is a separate test scene. It uses
real mouse input for navigation and the first loose-piece drag; deterministic placement/completion calls use
the existing cluster-solve path, not a simulated completion overlay. This
checks product transitions and persisted progress, not human manual solving.

**Results:** 35/35 native regression suites passed; changed navigation,
Gallery, photo, confirmation and replay layouts were rerun after their fixes.
The final Chromium flow passed 20 journey assertions with 29 screenshots and
zero page/console errors. Before restarting the runtime, the test observes
the real IndexedDB save commit instead of assuming an arbitrary delay means
FileAccess has reached browser storage. After completion and another reload,
Garden remains at 1/40, Twilight stays retired, and its history record remains.
The persistence poll awaits each IndexedDB read in Node and retries its Boolean
result; Playwright's `waitForFunction` can accept a truthy Promise even when it
resolves false. Completion also waits for the stored slot retirement and history
record before reload. This corrected a QA timing defect reproduced locally.
The production Web export separately passed the existing readiness smoke at
DPR 3 and a check for zero runtime errors and absence of the QA bridge.

Evidence: [native suite results](ux-evidence/regression-results.json),
[browser journey results](ux-evidence/browser-results.json).

| Journey | Accepted actual screenshots |
| --- | --- |
| First session and explicit setup | [Gallery](ux-evidence/after/01-first-gallery.png), [pieces](ux-evidence/after/02-piece-count-choices.png), [setup](ux-evidence/after/03-picture-setup.png), [gameplay](ux-evidence/after/04-gameplay.png), [real drag](ux-evidence/after/05-first-piece-drag.png) |
| Save and return | [Saved](ux-evidence/after/06-saved-gallery.png), [after reload](ux-evidence/after/07-returning-gallery.png) |
| Gameplay management | [Picture](ux-evidence/after/08-picture-reference.png), [Hint toggle](ux-evidence/after/09-hint-assist.png), [Trays](ux-evidence/after/10-trays.png), [Pieces](ux-evidence/after/11-pieces-strip.png), [More](ux-evidence/after/12-more-tools.png), [confirmation](ux-evidence/after/13-reshuffle-confirmation.png) |
| Discovery and private photos | [Favorites](ux-evidence/after/14-favorites.png), [My photos](ux-evidence/after/15-my-photos-empty.png), [safe photo setup](ux-evidence/after/16-photo-setup-safe.png), [Settings](ux-evidence/after/17-settings.png), [search](ux-evidence/after/18-search-results.png), [theme](ux-evidence/after/19-theme-filter.png), [For You](ux-evidence/after/20-for-you-filter.png) |
| Switching and orientation | [Unfinished](ux-evidence/after/21-unfinished-puzzles.png), [landscape discovery](ux-evidence/after/22-landscape-gallery.png), [reachable landscape setup](ux-evidence/after/23-landscape-setup.png), [gameplay](ux-evidence/after/24-landscape-gameplay.png) |
| Completion and retention | [Result](ux-evidence/after/25-completion.png), [replay](ux-evidence/after/26-replay.png), [history](ux-evidence/after/27-completed-history.png), [other progress after reload](ux-evidence/after/28-completion-persisted-gallery.png), [persisted history](ux-evidence/after/29-persisted-history.png) |

Reproduction in the prepared cloud shell:

```bash
source /workspace/.pieceful-cloud/activate.sh
# Use a fresh directory for this suite; it intentionally exercises real stores.
XDG_DATA_HOME=/tmp/pieceful-product-ux-fresh "$GODOT_BIN" --headless --path . \
  --script tests/commercial_product_navigation_smoke.gd
python3 tools/export_product_ux_qa.py --godot "$GODOT_BIN"
python3 -m http.server 4176 --directory build/ux-qa
# In another prepared cloud shell (Playwright 1.55 is installed here):
cp tests/commercial_product_browser_flow.mjs /workspace/.pieceful-cloud/browser/
PIECEFUL_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
PIECEFUL_TEST_PHOTO=tests/fixtures/product-ux-photo.png \
node /workspace/.pieceful-cloud/browser/commercial_product_browser_flow.mjs
```

The branch's preview workflow runs 24 relevant native suites, the production
Web readiness check, and this complete browser journey before publishing. It
preserves the existing Pages artifact and adds only the branch preview path;
its final deployment step checks `build-info.json` against the exact commit.

## 10. Remaining compromises and release gates

- Real iPhone Safari/native QA is still required: notch/home indicator,
  rotation, file picker cancel, background/foreground durability, actual pinch
  and drag, share/download/export, and long-session thermal performance.
- Chromium touch emulation is not an iOS test. Native gesture regression
  tests remain the evidence for unchanged pinch/drag arbitration in this pass.
- The Godot canvas does not expose a normal semantic DOM for screen readers.
  Larger targets and clearer labels do not establish VoiceOver/WCAG compliance.
- Gallery is still a centered watercolor sheet over the restored board, with
  scrolling discovery content when a returning player's banner is present.
  A separate full-page routing framework would add scope without changing
  these validated decisions.
- Old More links remain as compatibility shortcuts; History/unfinished games
  now have better destinations, but overflow is not completely tool-only.
- Trays is still a learned concept. Its established manager is preserved;
  tooltip guidance does not substitute for an iPhone first-time-player study.
- Original catalog bytes are now retained alongside imported textures for
  durable identity. The local Web pack grows from approximately 16 MiB to
  33 MiB; startup download size should be measured on a real mobile network.
- Saved games/photos are local to the device/browser origin. No account/cloud
  synchronization was added. Clearing browser storage can remove them.
- Abrupt reload/background persistence remains a real-device release gate;
  an in-memory FileAccess save is not a transactional guarantee that browser
  storage has finished syncing. The reproduced completion sync race has a
  targeted Web fix; Safari still needs its own durability testing.
- Photos are imported into the local collection even if setup is cancelled;
  cancellation preserves the live game, not a transactional undo of importing.
- Purchase/restore availability depends on the existing mobile provider.
  Web preview cannot validate real StoreKit/Google Play transactions.
- Playback/video export availability depends on recorded trace and browser
  capture support. No rendering/export rewrite was included.
- Source/tests review and runtime evidence are different levels of certainty.
  Blocked competitor research and missing participant data remain explicit.
- Some passing native suites emit RID/ObjectDB cleanup warnings at process
  exit. Functional regression passes do not establish a memory-leak clearance;
  long-session device profiling remains necessary.
- No merge or production release is authorized by this preview pass. Wait for
  the user's real-device QA.
