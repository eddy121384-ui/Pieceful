# Watercolor gameplay UI experiment

Branch: `spike/codex61-watercolor-ui`  
Base: `spike/gpt6-album-desk-polish` at `42b7e48f8d75ecf255bd18ca589dcfe51e5390a9`

The gameplay screen is a calm watercolor puzzle book: near-white paper, green-grey
ink, generous breathing room, and a little sage, blue and rose pigment at the page
edges. The puzzle remains the strongest color and the principal subject.

## Presentation

- Open editorial masthead and progress, printed directly on the page. Roman serif
  title with a small italic pace line; numeric progress stays legible and quiet.
- Four named controls on an open bottom margin. No raised sheet, fold, protruding
  tab, vertical dividers, heavy outline, or dock shadow.
- Original fine-line icons for Trays, Pieces, Reference and Hint. Existing action
  bindings and reference-mode cycling are retained.
- Selected actions use a soft pigment bloom, with a subtly pooled edge. There is
  no raised button or animated decoration during solving.
- A cool off-white mounting mat and restrained reference-image frame. Piece
  appearance, geometry, depth, contact shadows and interaction stay unchanged.
- Secondary tools appear on one quiet paper utility sheet. Rows retain generous
  touch targets and scroll within short viewports. CSS safe-area insets continue
  to pass through the existing metrics adapter.

## Assets and licensing

All new artwork is original procedural/vector artwork made for this repository:

- `assets/ui/watercolor-paper.gdshader`: static paper grain and edge pigment;
- `assets/ui/watercolor-rule.gdshader`: a tapered dry-brush divider;
- `assets/ui/watercolor-gameplay-icons.svg`: four gameplay-only ink icons;
- `_make_watercolor_selection()`: one generated 160 × 112 RGBA texture shared by
  every selected action. It is generated once per scene, without a bitmap file.

No third-party artwork, texture, font, or paid asset was added. The existing
embedded serif fonts are reused; their commercial-use license remains in
`assets/ui/ALBUM-FONT-LICENSE.txt`. The shared app icon atlas is unchanged.

## Verification and visual review

Native Godot 4.7.2 captures were reviewed at 390 × 844 and 844 × 390, including
the utility sheet and floating reference. Iteration removed the original brown
stacked-paper furniture, then improved icon legibility, the small pace line,
reference clearance and scrollable utility-sheet touch targets.

The HUD smoke now checks the new presentation, phone control separation and
short-viewport utility-sheet bounds. The preview workflow also runs the unchanged
touch arbitration, piece pinch handoff, piece depth, overlap z-order, Gallery flow
and startup/resume presentation tests, followed by Web export and the existing
mobile browser runtime smoke with an exact build-SHA check.

Preview path: `/Pieceful/previews/codex61-watercolor-ui/`. The branch-specific
workflow preserves the previous successful Pages artifact and adds this path. It
fails rather than replacing unrelated pages if that artifact is unavailable.
Future deployments through the older root publisher can replace the Pages site
and remove this experiment's path; rerun this branch workflow to restore it.

## Remaining compromises / real-device QA

- Gallery, Journal, completion flows and other app screens keep their existing
  art direction. They are outside this gameplay-only experiment.
- Pigment is deliberately subtle and static; it suggests wash on paper without
  importing decorative art or changing puzzle rendering.
- Safari/iPhone OLED contrast, safe areas, small-screen touch comfort, rotation,
  sustained frame rate and real pinch/drag behavior require physical-device QA.
- The preview uses the existing shared GitHub Pages deployment; the dedicated
  path preserves the current entry point but is not a permanent hosting slot.

Do not merge before iPhone real-device review.
