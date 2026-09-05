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

## Floating tray metaphor

An open tray is a draggable, translucent floating window above the puzzle table rather than a fixed sidebar or modal sheet.

- A dedicated drag handle moves the tray without moving puzzle pieces.
- The tray body uses a translucent background while artwork thumbnails remain fully legible.
- The puzzle board remains interactive outside the tray window.
- Each tray remembers the position where the player left it during the current puzzle generation.
- Portrait / Landscape changes preserve that chosen position as far as possible and only clamp the tray back inside the visible viewport when necessary.
- Portrait layouts may reduce the floating tray size to keep it usable on phone-like viewports instead of forcing a desktop-width panel.

This models a real sorting tray that the player can place wherever it is convenient instead of forcing the workspace to reorganize around a fixed UI panel.

## Touch-first direct drop

The primary storage flow is:

1. Open the desired tray.
2. Place the floating tray where convenient.
3. Drag a loose piece or joined cluster directly from the puzzle table into the tray window.
4. Release the mouse / finger inside the tray window.
5. Runtime intercepts that release before normal neighbor merge or board snap, stores the whole sorting item, and refreshes the visual tray contents.

There is no required `select piece → press Move selected here` step in the player flow.

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

Tray membership and player-positioned floating tray locations survive Portrait / Landscape reflow within the same puzzle generation. Stored pieces remain hidden and inert while the board reflows, then are re-stashed after the board resize debounce settles. Floating tray positions are clamped only when the new viewport would otherwise place part of the tray off-screen.

Reshuffle / Play again and difficulty changes are treated as a new puzzle generation in this foundation, so player-created trays, memberships, and floating-window positions reset. Disk persistence belongs to Issue #3 after #14 / #15 settle the final workspace model.

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
4. Open a tray and drag the tray itself to several positions; confirm the board remains playable outside it.
5. Confirm the tray background is translucent while stored artwork thumbnails remain clear.
6. Drag a single loose piece directly into the relocated tray and release; confirm it disappears from the table without any extra button press.
7. Confirm the tray shows that piece as its actual artwork / silhouette, never an internal numeric ID.
8. Drag a loose piece near the tray but release outside it; normal board behavior should continue and the piece should not be stored.
9. Join 2–3 neighboring pieces, drag the cluster into the tray, and confirm one combined cluster preview appears and the cluster is not split.
10. Use `Return to Loose` and confirm the piece / cluster returns playable with cluster geometry intact.
11. Rename a tray and confirm both tray list and open window update.
12. Move an open tray, switch Landscape ↔ Portrait, and confirm the window stays visible instead of resetting to a fixed side position; stored memberships remain intact.
13. On a phone-like Portrait viewport, confirm the tray remains completely on-screen and still leaves usable board area around it.
14. Reshuffle and difficulty changes should begin a fresh generation with zero trays.
15. Anchor at least one piece and confirm Board count updates.
16. Recheck Preview, Hint, Lines, overlap picking, cluster merge, board snap, and runtime reshuffling for regressions.
