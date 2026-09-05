# V0-03 Sorting Workspace Foundation

This document defines the first product-shaped Sorting Workspace slice for Issue #14.

## Core model

Pieces have three logical locations:

- `loose` — available on the puzzle table,
- `tray` — intentionally stored in a player-created sorting tray,
- `board` — anchored / solved.

The location model remains independent from UI nodes so future Save / Resume can persist logical workspace state rather than screen coordinates.

## Player-created trays

The runtime no longer starts with a mandatory `Tray 1` engineering fixture.

Players may:

1. Open `Sort`.
2. Enter a tray name and create a tray. Blank names fall back to `Tray 1`, `Tray 2`, etc.
3. Create multiple trays with their own names.
4. Click a tray card to open its dedicated contents window.
5. Rename the tray from that window.

The main Sorting panel shows tray names and piece counts; it does not expose internal piece IDs.

## Visual tray contents

A tray contents window renders each stored sorting item using the actual puzzle artwork and exact piece silhouette.

- A single loose piece appears as its real piece image.
- A joined cluster appears as one combined visual cluster preview.
- Internal labels such as `Piece 037` are not player-facing UI.

Each visual item has an explicit `Return to Loose` action.

## Cluster semantics

A selected persistent cluster is treated as one sorting item.

Moving it into a tray:

- preserves the existing cluster membership,
- stores every member in the same tray,
- hides / disables every member from table picking and snapping,
- does not split the cluster.

Returning it to Loose restores the cluster as one rigid group at a safe workspace location.

Solved / anchored pieces cannot be moved back into a tray.

## Responsive behavior

Tray membership survives Portrait / Landscape reflow within the same puzzle generation. Stored pieces remain hidden and inert while the board reflows, then are re-stashed after the board's resize debounce settles.

Reshuffle / Play again and difficulty changes are still treated as a new puzzle generation in this foundation, so player-created trays and memberships reset. Disk persistence belongs to Issue #3 after #14 / #15 settle the final workspace model.

## Still outside this slice

- tray reorder / collapse / delete,
- direct world-space drag-and-drop onto CanvasLayer tray UI,
- multi-select across unrelated pieces / clusters,
- full-screen Sorting Table,
- Edge-only filter,
- Save / Resume.

## Local smoke gate

Before merging this foundation:

1. Launch Relaxed and confirm normal Drag / Snap / Zoom / Pan still works.
2. Open Sort and create at least three differently named trays.
3. Confirm each tray card shows the chosen name and current piece count.
4. Click each tray and confirm a separate tray contents window opens.
5. Rename a tray and confirm the new name updates both the window and main tray list.
6. Select a single loose piece, open a chosen tray, and use `Move selected here`; confirm the piece disappears from the table.
7. Confirm the tray window shows that piece as an artwork thumbnail with its real silhouette, not an internal numeric ID.
8. Return the piece to Loose and confirm it becomes playable again.
9. Join 2–3 neighboring pieces into a cluster, move that cluster into a tray, and confirm the tray shows one combined cluster preview.
10. Return the cluster and confirm its relative assembly remains intact.
11. Store pieces / clusters in different trays, switch Landscape ↔ Portrait, and confirm memberships and inert storage survive.
12. Reshuffle and difficulty changes should begin a fresh generation with zero trays.
13. Anchor at least one piece and confirm Board count updates.
14. Recheck Preview, Hint, Lines, overlap picking, cluster merge, board snap, and runtime reshuffling for regressions.
