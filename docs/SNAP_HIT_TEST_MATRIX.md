# V0-02 Snap / Hit-test Polish Matrix

This matrix is the manual acceptance gate for the basic Piecepace workspace. It focuses on the three approved representative runtimes and the zoom levels where the old world-space-only snap tolerance changed most noticeably.

## Snap policy under test

Runtime snap keeps the historical piece-relative baseline (`short edge × 0.18`) but clamps the visible correction window to **12–24 screen pixels**.

This means dense puzzles no longer collapse to a ~5 px snap target at 100% zoom, while Relaxed pieces no longer grow to a ~40 px snap target at 300% zoom.

Approximate expected screen-space radii for the current 600×375 demo board:

| Difficulty | Grid | Pieces | 100% | 200% | 300% |
| --- | --- | ---: | ---: | ---: | ---: |
| Relaxed | 8×5 | 40 | 13.5 px | 24 px | 24 px |
| Standard | 15×10 | 150 | 12 px | 13.5 px | 20.3 px |
| Hard | 22×13 | 286 | 12 px | 12 px | 14.7 px |

## Manual matrix

For each difficulty at 100%, 200%, and 300% zoom, run the following checks.

1. **Neighbor snap** — bring two true neighbors close together. A visibly small final correction should connect; a clearly separated pair should not magnetically jump together.
2. **Board snap** — move a loose piece or small cluster near its final board target. The final correction should feel intentional rather than requiring pixel-perfect placement or pulling from an obviously wrong position.
3. **Cluster stability** — after a neighbor merge, drag the cluster through loose pieces and release it several times. Membership must remain stable and dragging must stay smooth.
4. **Overlap hit-test** — deliberately overlap 3–5 loose pieces, then repeatedly pick the visually top piece, move it away, and repeat. Picking should follow the visible z-order without obvious click-through to a lower piece.
5. **Partly exposed hit-test** — click a visible tab / blank / body area of a partly covered piece. A cheap rectangular PhysicsServer broadphase is allowed, but the actual drag winner must still be inside the exact visible cut polygon under the pointer.
6. **Raise-on-pick** — drag a loose piece or cluster through a pile, release, then pick it again. The item just interacted with should remain visually/pickably above untouched loose pieces.
7. **No accidental solve** — brushing past the board or another island outside the visible snap window must not solve or merge unexpectedly.
8. **Off-board cluster shadow** — join 2–5 pieces into an island away from the board. The island should keep an exterior floating shadow, but there must be no dark internal shadow seam between joined neighbors. Add another neighbor and re-check before anchoring the cluster to the board.

## Confirmed local observations

- 3–5-piece overlap picking no longer selects a visually lower piece after exact-polygon + z-order winner resolution.
- Off-board cluster internal shadow seam is fixed after assigning one shared z-index to every member of a raised cluster; exterior floating shadow remains.
- Latest pre-segment-cache timing sample:
  - Standard 150: total 160 ms · JSON/decode 54 ms · outlines 78 ms · nodes/scatter/other 28 ms.
  - Hard 286: total 272 ms · JSON/decode 63 ms · outlines 144 ms · nodes/scatter/other 65 ms.
- Outline construction remains the largest single Hard switch phase, so the current branch now caches rendered shared boundary segments inside the active CutPattern instance. Adjacent pieces reuse the same sampled edge instead of sampling it twice.

## Difficulty-switch performance smoke

After pulling the current branch, switch **Relaxed → Standard → Hard → Standard**. The Godot debug console prints one timing line per difficulty change:

`Piecepace difficulty switch · ... · total ... ms · JSON/decode ... ms · outlines ... ms · nodes/scatter/other ... ms`

Record the Standard and Hard lines again after the shared-segment cache change. Compare them with the baseline above.

The current branch also replaces the thousands-of-points `CollisionPolygon2D` with a four-point bounding polygon used only as broadphase. Runtime selection then checks the full visible polygon and z-order in software. This fixes lower-piece click-through and reduces dense difficulty construction cost without making transparent rectangle corners actually draggable.

## Acceptance

A cell passes when neighbor snap and board snap both feel usable without obvious over-magnetism, while overlap picking remains predictable. Any failure should record the exact difficulty, zoom, orientation, and whether the problem is neighbor snap, board snap, cluster drag, or z-order/picking.

Portrait / Landscape are not separate 18-cell matrices here because PR #20 already established live orientation reflow. At minimum, repeat one representative 200% test in Portrait after the landscape matrix is clean.

PR #21 should stay Draft until snap feel, representative portrait interaction, and the post-cache difficulty-switch timing are acceptable.
