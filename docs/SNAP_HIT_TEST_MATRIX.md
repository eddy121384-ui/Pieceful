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
5. **Raise-on-pick** — drag a loose piece or cluster through a pile, release, then pick it again. The item just interacted with should remain visually/pickably above untouched loose pieces.
6. **No accidental solve** — brushing past the board or another island outside the visible snap window must not solve or merge unexpectedly.

## Acceptance

A cell passes when neighbor snap and board snap both feel usable without obvious over-magnetism, while overlap picking remains predictable. Any failure should record the exact difficulty, zoom, orientation, and whether the problem is neighbor snap, board snap, cluster drag, or z-order/picking.

Portrait / Landscape are not separate 18-cell matrices here because PR #20 already established live orientation reflow. At minimum, repeat one representative 200% test in Portrait after the landscape matrix is clean.
