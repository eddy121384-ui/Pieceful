# Rail / Scatter cardboard transition correction

Branch: `spike/codex61-commercial-product-ux-pass`.

The regular transition ghost in `loose_piece_layout_dock_ui.gd` built only a
`Polygon2D` artwork face and a hard-coded white `Line2D` at 60% alpha. It omitted
ContactShadow, Thickness, and the shared EdgeRelief material. Its unchanged
0.38-second duration plus up to 0.12-second stagger explains the reported
approximately half-second legacy-outline flash. The separate dense motion
sample in `chaos_order_layout_dock_ui.gd` also had a face-only fallback.

Both paths now use `PuzzlePieceVisualFactory.add_piece_visuals()` through the
same ghost builder. Joined members use `apply_joined_state()`, including the
shared joined relief material and suppressed individual contact shadows.
The builder uses the real source piece's nominal extent and unchanged contour,
UVs, texture, and relative member offsets. The existing group transform supplies
the transition scale. Dense sampling still selects up to 18 groups and keeps its
existing face alpha. No factory or shader design, geometry, positions, timing,
z rules, input, layout ownership, or save/resume code changed.

The focused native regression extends `rail_layout_visibility_smoke.gd` to
reject legacy/flat stacks, missing shared relief materials, missing thickness,
incorrect joined shadows, altered layer z values, and failed interaction
restoration. It covers automatic toggles (joined table islands remain on the
table), explicit joined Rail storage/return, repeated toggles, and the dense
ghost builder. The existing depth, overlap z-order, watercolor gameplay, HUD,
gesture arbitration, piece/pinch handoff, and zoom recovery regressions also
passed: 8/8 locally. Native teardown still emits the existing CanvasItem/ObjectDB
warnings; the tests exit successfully with their PASS markers.

`rail_scatter_transition_browser_smoke.mjs` runs the actual exported QA scene at
DPR 3 in mobile Chromium, in 390×844 portrait and 844×390 short landscape, with
40 and 286 pieces. Each case uses eight rendered-button toggles, including both
directions, single pieces, table islands, explicit Rail islands, and repetition.
Joined fixtures use the real board merge machinery; storing them in Rail and
dragging after transitions use actual pointer input. Every observed animation
frame checks the four shared layers, relief state, thickness, joined shadows,
and unchanged z band. The same check is required by the branch preview CI.
All four cases passed: 32 transitions, 112 observed animation frames, and 3,350
piece visual stacks, with zero stack violations or browser runtime errors.

Evidence is in `rail-scatter-evidence/`: native results, browser results, a frame
audit, and representative runtime captures. CI uploads full frame traces,
captures, and recordings under its commercial-product-ux-journeys artifact.
This is desktop Chromium Web runtime verification with mobile dimensions and
DPR, rather than a new physical iPhone/Safari run.

Preview: <https://eddy121384-ui.github.io/Pieceful/previews/codex61-commercial-product-ux-pass/>.
The deployment workflow verifies the published build-info branch and exact SHA.
No merge is part of this correction.
