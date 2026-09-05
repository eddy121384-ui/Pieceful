# V0-03 Sorting Workspace Foundation

This document defines the first product-shaped Sorting Workspace slice for Issue #14.

## Core model

Pieces have three logical locations:

- `loose` — available on the puzzle table,
- `tray` — intentionally stored in a player-created sorting tray,
- `board` — anchored / solved.

The location model remains independent from UI nodes so future Save / Resume can persist logical workspace state rather than screen coordinates.

## Player-created trays

The runtime starts with no mandatory engineering fixture. Players can create multiple trays, name them at creation time, use fallback names such as `Tray 1`, and rename them later.

The main Sorting panel shows tray names and piece counts. Clicking a tray opens its dedicated contents window.

## Touch-first direct drop

An open tray is a non-modal floating drop target. The puzzle board remains interactive while the tray is open.

The primary storage flow is:

1. Open the desired tray.
2. Drag a loose piece or joined cluster directly from the puzzle table into the tray window.
3. Release the mouse / finger inside the tray window.
4. Runtime intercepts that release before normal neighbor merge or board snap, stores the whole sorting item, and refreshes the visual tray contents.

There is no required `select piece → press Move selected here` step in the player flow.

For touch ergonomics, Portrait presents the tray as a bottom-sheet-like floating window while Landscape places it at the right side so a substantial portion of the puzzle table remains visible and draggable.

## Visual tray contents

A tray contents window renders each stored sorting item using the actual puzzle artwork and exact piece silhouette.

- A single loose piece appears as its real piece image.
- A joined cluster appears as one combined visual cluster preview.
- Internal labels such as `Piece 037` are not player-facing UI.

The current foundation keeps an explicit `Return to Loose` action on each visual item. Direct drag from Tray back to the board can be layered on after the board-to-tray touch path is validated.

## Cluster semantics

A persistent off-board cluster is treated as one sorting item. Dragging any member of that cluster into an open tray stores the entire cluster without splitting it.

Stored members are hidden, non-pickable, and excluded from normal snapping. Returning them to Loose restores the cluster as one rigid group at a safe workspace location.

Solved / anchored pieces cannot be moved back into a tray.

## Responsive behavior

Tray membership survives Portrait / Landscape reflow within the same puzzle generation. Stored pieces remain hidden and inert while the board reflows, then are re-stashed after the board resize debounce settles.

Reshuffle / Play again and difficulty changes are treated as a new puzzle generation in this foundation, so player-created trays and memberships reset. Disk persistence belongs to Issue #3 after #14 / #15 settle the final workspace model.

## Still outside this slice

- tray reorder / collapse / delete,
- direct Tray-to-board drag return,
- multi-select across unrelated pieces / clusters,
- full-screen Sorting Table,
- Edge-only filter,
- Save / Resume.

## Local smoke gate

Before merging this foundation:

1. Launch Relaxed and confirm normal Drag / Snap / Zoom / Pan still works.
2. Open Sort and create at least three differently named trays.
3. Confirm each tray card shows the chosen name and current piece count.
4. Open a tray and confirm the tray window does not block interaction with the visible board area.
5. Drag a single loose piece directly into the open tray and release; confirm it disappears from the table without any extra button press.
6. Confirm the tray shows that piece as its actual artwork / silhouette, never an internal numeric ID.
7. Drag a loose piece near the tray but release outside it; normal board behavior should continue and the piece should not be stored.
8. Join 2–3 neighboring pieces, drag the cluster into the tray, and confirm one combined cluster preview appears and the cluster is not split.
9. Use `Return to Loose` and confirm the piece / cluster returns playable with cluster geometry intact.
10. Rename a tray and confirm both tray list and open window update.
11. Store pieces / clusters in different trays, switch Landscape ↔ Portrait, and confirm memberships and inert storage survive.
12. Reshuffle and difficulty changes should begin a fresh generation with zero trays.
13. Anchor at least one piece and confirm Board count updates.
14. Recheck Preview, Hint, Lines, overlap picking, cluster merge, board snap, and runtime reshuffling for regressions.
