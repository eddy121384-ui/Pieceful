# V0-03 Sorting Workspace Foundation

This document defines the first product-shaped Sorting Workspace slice for Issue #14.

## Core model: workspace surfaces, not folders

A Tray is not a storage folder and its contents are not inert thumbnails.

The player has multiple puzzle surfaces:

- `loose` — the main puzzle table,
- `tray` — a player-created floating mini puzzle table,
- `board` — the anchored / solved target board.

A piece / cluster can move between the main table and a Tray, but its puzzle identity and cluster relationships are shared across surfaces. A cluster assembled inside a Tray is still that same cluster when dragged back to the main table.

Each Tray therefore owns local piece coordinates in addition to membership. This is the beginning of the workspace state that later Save / Resume can persist.

## Player-created trays

The runtime starts with no mandatory engineering fixture. Players can create multiple trays, name them at creation time, use fallback names such as `Tray 1`, and rename them later.

The main Sorting panel shows tray names and piece counts. Clicking a tray opens that Tray's live mini workspace.

## Floating tray metaphor

An open Tray is a draggable, translucent floating mini table above the main puzzle table rather than a fixed sidebar, modal sheet, or file browser.

- A dedicated drag handle moves the Tray itself.
- The mini-table canvas remains interactive independently from the window drag handle.
- Each Tray remembers its current-session floating position.
- Portrait / Landscape changes keep the chosen position as far as possible and clamp only when the window would leave the viewport.
- The main puzzle table remains interactive outside the floating Tray.

## Direct Main Table ↔ Tray movement

Main Table → Tray:

1. Open the desired Tray.
2. Drag a loose piece or joined cluster directly from the main table into the Tray canvas.
3. Release inside the mini canvas.
4. Runtime intercepts that release before normal main-table snap, transfers the same puzzle item to the Tray surface, and places it at the local drop position.

Tray → Main Table:

1. Grab a piece / cluster directly inside the Tray canvas.
2. Drag it across the Tray canvas edge.
3. Release outside the mini canvas.
4. The same piece / cluster returns to the main table under the pointer and immediately uses the normal main-table neighbor / board snap rules.

There is no `select → Move` button and no `Return to Loose` button in the primary interaction.

## Playing inside a Tray

Pieces inside a Tray are active puzzle pieces, not preview cards.

- They render with the real puzzle artwork and exact cut silhouette.
- They can be dragged around the mini canvas.
- Joined clusters drag as one rigid group.
- Neighboring pieces / clusters use the same target-relative puzzle geometry and can snap together inside the Tray.
- A successful Tray snap updates the shared global cluster relationship.
- Dragging that assembled cluster back to the main table preserves the assembly.

This lets a player create semantic work areas such as `Sky`, `Building`, or `Edges` and actually solve those portions inside their Tray before returning a larger island to the main table.

## Surface isolation

A piece currently on a Tray surface is hidden / non-pickable on the main world surface so it cannot accidentally interact with main-table snapping while the player is working inside the Tray.

The Tray canvas owns the visible interactive representation for those members. The main PuzzleBoard continues to own the canonical puzzle definition and global cluster membership.

Solved / anchored pieces cannot be moved back into a Tray.

## Responsive behavior

Tray membership, Tray-local piece positions, cluster relationships, and player-positioned floating-window locations survive Portrait / Landscape reflow within the same puzzle generation.

Reshuffle / Play again and difficulty changes are treated as a new puzzle generation in this foundation, so player-created Trays and their local workspace state reset. Disk persistence belongs to Issue #3 after #14 / #15 settle the final workspace schema.

## Still outside this slice

- tray reorder / collapse / delete,
- multi-select across unrelated pieces / clusters,
- independent Tray zoom / pan,
- full-screen Sorting Table,
- Edge-only filter,
- Save / Resume.

## Local smoke gate

Before merging this foundation:

1. Launch Relaxed and confirm normal main-table Drag / Snap / Zoom / Pan still works.
2. Create and rename several Trays.
3. Move an open floating Tray to several screen positions.
4. Drag a single main-table piece directly into the Tray canvas; it should remain visible inside the mini table rather than becoming a thumbnail card.
5. Drag that piece around inside the Tray canvas.
6. Drag it out across the Tray edge and release on the main table; it should return under the pointer with no Return button.
7. Put two correct neighboring pieces into the same Tray separately and assemble them inside the Tray; confirm they snap into one cluster.
8. Drag the newly assembled Tray cluster around; all members must move rigidly together.
9. Drag that cluster back to the main table and confirm the assembly remains intact.
10. Put a preassembled main-table cluster into a Tray and confirm it remains assembled and playable there.
11. Release a main-table piece just outside the Tray canvas; it must not be transferred accidentally.
12. While a Tray is open, the visible main-table area must remain interactive.
13. Move the Tray, switch Landscape ↔ Portrait, and confirm Tray position, membership, local mini-table layout, and cluster relationships survive.
14. On a phone-like Portrait viewport, confirm the floating Tray remains on-screen and leaves enough surrounding main-table area to support direct drag in / out.
15. Reshuffle / difficulty change should start a fresh generation with zero Trays.
16. Recheck Preview, Hint, Lines, overlap picking, cluster merge, board snap, and runtime reshuffling for regressions.
