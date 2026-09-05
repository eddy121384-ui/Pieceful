# V0-03 Sorting Workspace Foundation

This document defines the first executable slice of Issue #14. It intentionally proves the container/state boundary before adding the full Tray UX.

## Product slice

The foundation introduces three piece locations:

- `loose` — an unsolved piece currently available on the puzzle table,
- `tray` — a piece intentionally stored in a player sorting tray and removed from the active table,
- `board` — a piece already anchored / solved on the puzzle board.

The state model is independent from the visual panel so later Save / Resume can persist the same logical locations without serializing screen coordinates or UI nodes.

## Tray 1 prototype

The runtime starts with one default player container, `Tray 1`.

Flow:

1. Touch / drag a loose piece so it becomes the current selected piece.
2. Open `Sort`.
3. `Move selected → Tray 1` removes that piece from the active puzzle table and increments the Tray count.
4. Select a piece in the Tray list.
5. `Return tray piece → Loose` restores it to the puzzle workspace.

The returned piece prefers its previous loose position. If the viewport/orientation changed and that old position is no longer safe, the controller clamps / relocates it into the current loose workspace rather than placing it through the board.

## Deliberate v0.1 restrictions

This slice stores **single loose pieces only**.

A piece that already belongs to a multi-piece persistent cluster cannot be sent to Tray 1 yet. This avoids inventing cluster-splitting or whole-cluster sorting semantics before Issue #14 decides the intended multi-select / multi-piece UX.

Solved pieces cannot be moved back into a Tray.

Tray pieces are hidden, non-pickable, and stashed outside the active navigation area so the existing neighbor-snap / cluster code cannot accidentally assemble against a stored piece. Responsive reflow is allowed to finish first, then tray pieces are re-stashed.

## State reset behavior

This foundation treats Reshuffle / Play again and difficulty changes as a new puzzle generation:

- Tray membership resets,
- all newly generated pieces begin as `loose`,
- the selected piece resets.

Portrait / Landscape reflow within the same puzzle does **not** reset Tray membership.

Full persistence across app restarts belongs to Issue #3 after #14 / #15 define the final workspace schema.

## Not in this slice

- multiple user-created Trays,
- Tray rename / reorder / collapse / delete,
- drag-and-drop directly onto the Tray UI,
- thumbnails / visual tray layouts,
- multi-select,
- whole-cluster movement into a Tray,
- full-screen Sorting Table,
- Edge-only filter,
- Save / Resume.

## Local smoke gate

Before merging this foundation:

1. Launch Relaxed and confirm `Sort · 0` appears without changing normal Drag / Snap / Zoom / Pan.
2. Drag one loose single piece, open Sort, and move it to Tray 1.
3. Confirm the piece disappears from the table, Tray count becomes 1, and it cannot be clicked / snapped while stored.
4. Select that Tray entry and return it to Loose; confirm the same piece becomes playable again.
5. Put 2–3 separate single pieces into Tray 1 and return them in a different order.
6. Join two neighboring pieces into a cluster, select one of them, and confirm `Move selected → Tray 1` is disabled.
7. Put a piece in Tray 1, switch Landscape ↔ Portrait, and confirm it remains stored and does not reappear / participate in snapping.
8. Return that piece after orientation change and confirm it appears in a safe loose workspace position.
9. Reshuffle and confirm Tray resets to 0 and all new pieces are available again.
10. Switch Relaxed ↔ Standard ↔ Hard and confirm each new difficulty starts with an empty Tray.
11. Complete / anchor at least one piece and confirm the Sorting summary moves that piece from Loose to Board.
12. Recheck Preview, Hint, Lines, overlap picking, cluster merge, board snap, and runtime reshuffling for regressions.
