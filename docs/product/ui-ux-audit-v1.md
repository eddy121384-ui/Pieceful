# Piecepace V1-04A / 51a — UI/UX Audit + Visual Direction

Status: Draft for product review  
Issue: #51  
Scope: Audit only. No UI code changes in this slice.

## 1. Executive diagnosis

Piecepace is no longer missing core product capability. The current UI problem is that the interface grew by layering features through the runtime inheritance chain, so individual slices work but the app does not yet read as one intentionally-designed product.

The strongest existing direction is already visible:

- dark, low-noise surfaces;
- artwork is treated as the visual protagonist;
- completion and Journal use restrained language rather than gamified celebration;
- most controls are already moving toward compact icon-driven chrome.

The next phase should therefore **evolve the current quiet-dark direction**, not replace it with a new visual genre.

The largest product risks are:

1. product identity is inconsistent (`Pieceful` vs `Piecepace`);
2. Home / Gallery is still structurally a puzzle-selection modal rather than a true product destination;
3. too many workspace controls are simultaneously visible;
4. mobile touch relies on icon meaning / tooltip semantics that do not exist on touch;
5. monetization controls currently expose engineering/store state in the discovery surface;
6. styling is scattered across GDScript instead of a reusable design system;
7. Web portrait behavior is patched independently by feature, making future polish fragile.

---

## 2. Audit limitation

The GitHub Pages runtime could not be rendered from the current audit execution environment because the public page was blocked by the environment network layer.

This audit is therefore **code-backed, not screenshot-backed**. It inspects the actual runtime UI hierarchy, labels, dimensions, colors, layout rules, and regression tests in `main`.

Before locking 51b, one screenshot/device pass should verify the visual conclusions on:

- iPhone-class portrait;
- large-phone portrait;
- tablet portrait;
- tablet landscape;
- 1280×720 desktop/Web.

Items marked **Visual check** below require that pass.

---

## 3. Architecture findings

### P0 — There is no real app-wide design system yet

UI is constructed dynamically across a long inheritance chain and individual scripts directly create Controls, assign sizes, font sizes, colors, corner radii, shadows, and spacing.

Examples:

- `scripts/main.gd`
- `scripts/main_icon_ui.gd`
- `scripts/gallery_image_aware_main.gd`
- `scripts/puzzle_journal_main.gd`
- `scripts/completion_summary_main.gd`
- `scripts/sorting_workspace_controller.gd`
- `scripts/monetization_main.gd`

There is a useful beginning in:

- `scripts/app_ui_metrics.gd`
- `scripts/ui_icon_catalog.gd`

but these currently cover only part of the shell.

**Decision for 51b:** create shared typography, spacing, radius, surface, button, chip, card, modal and touch-target tokens. Prefer Theme / reusable helpers over new page-local magic numbers.

---

### P0 — Product naming is inconsistent

The product/repo direction is **Piecepace**, but player-facing runtime strings still contain **Pieceful**.

Confirmed examples:

- workspace title in `main_icon_ui.gd`;
- Gallery heading in `gallery_image_aware_main.gd`;
- startup curtain in `startup_gated_gallery_main.gd`;
- Puzzle Me error copy in `puzzle_me_main.gd`.

Meanwhile `project.godot` uses `Piecepace: Jigsaw Puzzles`.

**Decision:** lock one player-facing name before visual polish. Current roadmap/product copy says **Piecepace**.

---

### P1 — Web portrait responsiveness is feature-specific

The Web build intentionally keeps a 1280×720 logical Godot viewport while Safari may physically be portrait.

Gallery and Completion therefore each contain separate browser-orientation bridges:

- `PuzzleMeResponsiveMain`
- `CompletionSummaryMain`

Regression tests explicitly protect this behavior.

This works, but it means new UI can accidentally look landscape-sized on a portrait phone unless each feature remembers to query browser dimensions.

**Decision for 51b/51d:** centralize device/orientation UI metrics behind one responsive UI service/helper. Do not rewrite puzzle geometry; only centralize presentation sizing.

---

## 4. Product shell / navigation

### What to keep

- compact top chrome;
- dark translucent shell;
- persistent piece progress;
- access to unfinished puzzles and Journal;
- bottom action dock as a concept.

### What is wrong now

The top bar currently accumulates:

- product title;
- Unfinished puzzles;
- Journal;
- centered piece count;
- difficulty selector.

The bottom dock can contain roughly:

- Sorting;
- loose-piece layout;
- Preview;
- Hint;
- Board lines;
- Fit;
- Zoom out;
- zoom percentage;
- Zoom in;
- Reshuffle.

This is functional, but it makes the shell read like an editor/tool palette.

Several actions are also icon-only and depend on tooltips. Tooltips are not a reliable affordance on touch devices.

**Visual check:** verify top-bar crowding and physical touch sizes on portrait Web/native.

### Direction

During active play, the UI should answer only three questions:

1. How far along am I?
2. Where are my pieces / sorting tools?
3. How do I temporarily change my view?

Recommended active-play shell:

**Top**
- Back / Home
- artwork title or compact identity
- piece progress
- one overflow / settings entry

**Primary bottom dock**
- Sort / Trays
- Scatter ↔ Rail
- Preview
- Hint
- Fit

Move out of the primary dock:
- difficulty change;
- board-line preference;
- Reshuffle;
- explicit Zoom +/- on touch devices.

Desktop may still expose Zoom +/- where mouse-wheel use makes them useful.

Reshuffle is destructive enough to belong in overflow with confirmation.

Difficulty is a puzzle-setup decision and should not visually compete with active play.

---

## 5. Home / Gallery

### Current structure

The "Home" experience is still built inside `PuzzleSelectionOverlay`, originally a modal chooser.

It contains, in one hierarchy:

- Pieceful/Piecepace heading;
- For You / Fresh Picks;
- Reset taste;
- four text recommendation buttons;
- Puzzle Me button + privacy copy;
- search field;
- category dropdown;
- status dropdown;
- full Gallery;
- global difficulty chooser;
- Cancel / Start Puzzle actions;
- monetization status + Remove ads + Restore.

This is the single largest source of prototype/product mismatch.

### What to keep

- For You / Fresh Picks logic;
- local-first recommendation system;
- Gallery metadata/search/filter capability;
- Puzzle Me;
- image-aware difficulty;
- Favorites / Continue / Completed state.

### What to change

#### A. Make Home / Gallery a true destination

Do not present the primary discovery experience as a modal sheet floating above the puzzle workspace.

Recommended hierarchy:

1. Header
2. Continue Playing, when relevant
3. For You / Fresh Picks — image-first cards
4. Puzzle Me — first-class tile
5. Gallery
6. Search / filter controls only when requested or when browsing deeper

#### B. For You should be visual

Current recommendations are 142×36 text buttons. For an artwork product this underuses the strongest asset: the artwork.

Use image cards with:
- thumbnail;
- title;
- optional small context such as “Because you liked…” only if useful.

#### C. Reset taste belongs in Settings

`Reset taste` is an account/device maintenance action. It should not share the primary discovery header with recommendation content.

#### D. Search/filter should be quieter

Current persistent stack:
- search field;
- category OptionButton;
- state OptionButton.

Recommended:
- Search affordance;
- Filter button/chips;
- show filter controls on demand.

#### E. Gallery cards need fewer simultaneous controls

Current card can contain:
- image;
- title;
- favorite button;
- status line;
- Continue button.

Recommended:
- whole card is the main tap target;
- favorite as a small overlay affordance;
- status/progress as one compact chip/line;
- unfinished puzzle tap can lead directly to Continue or a clear detail state rather than adding another full-width button.

---

## 6. Puzzle Me

### What to keep

The value proposition is strong and product-specific:
- choose a local photo;
- privacy is explicit;
- the photo remains on-device.

The copy “Private by default · your photo stays on this device” is good.

### What to change

`＋ Puzzle Me · Choose a photo` currently behaves like another form button inside the Gallery modal.

Promote Puzzle Me into a visual first-class Home/Gallery tile so it reads as a feature, not an import utility.

After import, keep the privacy confirmation subtle; do not permanently allocate two text rows to it.

---

## 7. Monetization UI

### Current problem

The Home recommendation area currently exposes:

- “Preview · Ads only between puzzles”
- “Free · Ads only between puzzles”
- Remove ads
- Restore

This is useful for engineering validation but is not appropriate as permanent discovery UI.

### Direction

Move commerce to Settings / About / Store:

- **Remove ads** can be a small premium/value entry.
- **Restore purchases** belongs in purchase/settings support.
- player-facing Home should not show provider availability or Preview/Free engineering state.

Keep the product promise visible in appropriate brand copy:

> No ads while you puzzle.

Do not continuously display monetization state.

---

## 8. Puzzle Workspace

### What to keep

- artwork remains central;
- bottom dock avoids covering the board;
- 44×44 logical button baseline;
- Preview / Hint / Board Lines are independent;
- Scatter / Rail is a meaningful Piecepace-specific tool;
- Sorting Trays are a genuine differentiation.

### Problems

#### A. Control density

The workspace currently exposes too many equally-weighted controls.

The player cannot tell which are:
- core;
- view utilities;
- preferences;
- destructive actions.

#### B. Icon ambiguity

Examples such as Layout, Grid, Preview states, Tray, Replay and Reshuffle can be understood with hover tooltip on desktop, but touch has no reliable hover explanation.

#### C. Three-state Preview is hidden behind one toggle

Preview cycles:
- Off
- Floating
- Board

That is compact but opaque. The icon changes, yet the user may not understand that tapping repeatedly cycles modes.

#### D. Selected state is mostly alpha modulation

Hint / Preview / Board lines often communicate On/Off by changing opacity. That may be too subtle, especially against artwork.

### Direction

Use progressive disclosure:

- primary dock contains 4–5 frequent actions;
- advanced view options open a compact popover/bottom sheet;
- first-use labels/context hints explain Piecepace-specific tools;
- use clear selected-state surface/accent, not only icon alpha.

---

## 9. Sorting Workspace / Trays

### What to keep

This is one of Piecepace's strongest differentiators.

Good concepts already present:
- named trays;
- mini puzzle-table behavior;
- drag in / play / drag out;
- movable floating tray windows;
- Scatter ↔ Rail library mode.

### Product risk

The implementation inherits a desktop-window metaphor:
- tray manager panel;
- separate tray detail panel;
- draggable headers;
- floating positioning.

That can be excellent on tablet/desktop but heavy on a phone.

### Direction

Adaptive presentation:

**Tablet / landscape**
- preserve movable floating tray windows.

**Phone portrait**
- use bottom sheet / drawer / full-height tray surface;
- keep drag/drop semantics where comfortable;
- avoid forcing users to manage overlapping floating windows.

Also simplify terminology:

- prefer **Trays** or **Sort pieces** in player-facing chrome;
- reserve “Sorting Workspace” for explanatory/help copy.

---

## 10. Completion

### What to keep

Completion is already one of the strongest productized areas:

- finished artwork owns most of the card;
- “Puzzle complete” is clear;
- restrained copy (“A quiet moment, finished.”) matches the brand;
- stats are concise;
- More Like This exists;
- Replay / Share exists.

### What to change

The action hierarchy can become crowded because the completion stack can accumulate:

- More Like This label;
- two recommendation buttons;
- Browse all;
- Replay;
- Share;
- video-export related actions.

Direction:

1. Artwork
2. Completion statement
3. compact stats
4. one primary next action
5. visual More Like This row
6. Share / Replay as secondary actions

Do not let completion become another toolbar.

No confetti or high-arousal celebration is required; a restrained reveal/fade is more consistent with Piecepace.

---

## 11. Puzzle Journal

### What to keep

Journal has strong product voice:

> A record of time you chose to spend here.

Keep:
- Today / This week summaries;
- recent completed puzzles;
- artwork thumbnail;
- hint-free / hint-used fact;
- time spent.

### What to change

- Journal entry affordance currently uses a text button while nearby global destinations use icon buttons.
- Recent cards are text-dense three-line summaries.
- unify the navigation treatment and increase artwork/status hierarchy.

Recommended recent entry:

- thumbnail;
- artwork title;
- compact “40 pieces · 18m”;
- completion date as quiet metadata.

Keep the Journal emotionally reflective, not KPI-like.

---

## 12. Startup / loading

Current startup curtain is appropriately simple, but:

- it uses the wrong product name (`Pieceful`);
- it is nearly pure text on a flat dark screen.

Direction:
- correct identity;
- optionally add a subtle logo/mark;
- keep loading motion minimal;
- do not create a splash sequence that delays access.

---

## 13. Recommended visual direction

### Direction: **Quiet Gallery / Dark Table**

Evolve the current dark shell instead of introducing a new aesthetic.

Principles:

- artwork supplies most of the color;
- shell remains graphite / ink-dark;
- text is warm-neutral rather than stark UI-white where possible;
- use one subdued accent for selected/active state;
- surfaces are soft and layered, but avoid excessive glassmorphism;
- shadows only where spatial hierarchy needs them;
- no neon gamer treatment;
- no faux-wood / skeuomorphic puzzle-table treatment;
- no noisy gradients;
- no reward-game visual language.

The target feeling is:

> a quiet personal gallery that happens to contain a very capable puzzle table.

---

## 14. 51b design-system requirements

### Spacing
Base scale:
- 4
- 8
- 12
- 16
- 24
- 32

Avoid new arbitrary spacing unless geometry genuinely requires it.

### Radius
Suggested semantic scale:
- small controls: 10–12
- cards/panels: 16
- modal/large surface: 20–24

### Typography
Define semantic roles instead of page-local sizes:

- Display / completion: 28–32
- Page title: 24–28
- Section: 18–20
- Body: 15–16
- Meta: 12–13

Current runtime uses many local values from 11 through 30; normalize them.

### Touch
- minimum intended touch target: 44×44 in the **physical presentation**, not merely the logical Godot coordinate system;
- no critical action should depend on hover tooltip;
- disabled/selected states must be visually distinct without relying only on alpha.

### Surfaces
Create semantic styles:
- app background;
- top chrome;
- dock;
- elevated panel;
- card;
- modal;
- selected card;
- destructive confirmation.

### Buttons
Create semantic variants:
- primary;
- secondary;
- quiet/icon;
- selected toggle;
- destructive.

### Motion
- short fades / surface transitions;
- use motion to explain spatial change (for example Scatter ↔ Rail), not as decoration;
- avoid attention-seeking idle animation.

---

## 15. Navigation / information architecture target

### Home
- Piecepace header
- Continue Playing
- For You / Fresh Picks image cards
- Puzzle Me tile
- Gallery
- Search / Filters
- Settings

### Puzzle setup
After choosing artwork:
- artwork preview;
- difficulty / piece count;
- Start Puzzle.

Do not keep the whole Gallery and puzzle-setup actions in one permanent modal hierarchy.

### Active puzzle
- Back/Home
- artwork identity
- progress
- compact tool dock
- overflow/settings

### Completion
- artwork
- completion
- concise stats
- next action
- related artwork
- secondary replay/share

### Settings
Move here:
- audio;
- Remove Ads;
- Restore Purchases;
- Reset recommendation taste;
- privacy/support items later.

---

## 16. What should *not* change in 51b–51f

Do not use polish as justification to redesign working core behavior.

Keep:
- local-first saves;
- no-account flow;
- recommendation logic;
- puzzle geometry;
- drag/snap behavior;
- tray semantics;
- Scatter/Rail semantics;
- No ads while you puzzle policy;
- completion/journal data models.

This milestone is productization, not feature expansion.

---

## 17. Required visual verification before 51a is LOCKED

Because live canvas screenshots were unavailable in this audit environment, verify these on real screenshots/builds:

1. top-bar overlap/crowding;
2. actual physical touch size on phone Web;
3. bottom-dock density;
4. gallery card hierarchy with museum thumbnails;
5. portrait Gallery vertical rhythm;
6. Sorting floating-window usability on phone;
7. Completion action crowding;
8. Journal recent-card density;
9. contrast/readability of 0.48–0.62 alpha secondary text;
10. whether the dark translucent surfaces separate cleanly from dark artwork.

Suggested matrix:

- 390×844 portrait
- 430×932 portrait
- 820×1180 tablet portrait
- 1180×820 tablet landscape
- 1280×720 desktop/Web
- 1440×900 desktop

---

## 18. 51a proposed LOCK decisions

These are recommendations pending product-owner review:

1. **Brand:** Piecepace is the player-facing name.
2. **Visual direction:** Quiet Gallery / Dark Table.
3. **Home:** full product destination, not a puzzle-selection modal.
4. **For You:** image-first recommendation cards.
5. **Puzzle Me:** first-class discovery tile.
6. **Monetization:** move Remove Ads / Restore / provider state out of Home.
7. **Workspace:** reduce primary dock to frequent actions; move destructive/advanced actions to overflow.
8. **Mobile Trays:** adaptive phone sheet/drawer; preserve floating windows for larger screens.
9. **Completion:** keep artwork-first restrained reveal; reduce action clutter.
10. **Journal:** keep reflective voice and summary concept; simplify recent cards.
11. **51b:** centralize Theme/tokens/responsive metrics before screen-by-screen restyling.

Once these are approved and the screenshot verification is complete, 51a can be marked LOCKED and 51b can begin.
