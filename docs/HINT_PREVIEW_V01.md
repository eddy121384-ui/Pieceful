# Hint / Preview / Board Lines v0.1

This document defines the first player-facing assistance contract for Issue #2.

## Product contract

### Preview

- Preview is an explicit **On / Off** player setting.
- The solved image is fully hidden from the puzzle board during normal play.
- With `Preview: On`, the complete source image appears in a separate reduced floating reference card in screen-space UI.
- The reference card stays screen-space during puzzle Zoom / Pan and does not alter board geometry.
- The card can be dragged to another part of the viewport when it obscures pieces; it is clamped inside the current viewport after dragging or orientation changes.
- Preview never moves, snaps, solves, or selects a piece.

### Hint

- Hint is an explicit **On / Off** player setting.
- Normal runtime defaults to `Hint: On`.
- With Hint On, picking an unsolved piece temporarily highlights only its approximate target cell / board region.
- The hint does **not** show the exact cut outline and never moves or solves the piece.
- Releasing the piece hides the target region.
- With `Hint: Off`, no target marker is shown at all. There is no idle timer, automatic rescue, or forced hint after the player has been stuck for a long time.
- Preview remains independent of Hint.

### Board Lines

- Board Lines are an explicit **On / Off** player setting.
- Normal runtime defaults to `Lines: On`.
- With Lines On, the board shows subtle internal die-cut boundaries, similar to faint pressed / cut traces on a physical puzzle board.
- Only internal shared boundaries are drawn; the existing BoardFrame owns the outer border.
- Lines live in puzzle-world coordinates, so they zoom and pan with the board.
- Lines are visual guidance only and never affect hit-test, snap, cluster, or solved state.
- With `Lines: Off`, the board is visually clean except for its outer frame.

The three controls are fully independent. A deliberate no-assistance challenge can use `Preview: Off + Hint: Off + Lines: Off`, including very large or panoramic puzzles.

## Reshuffle behavior

The base scatter generator keeps a fixed seed for reproducible regression geometry, but player-facing runtime reshuffles must not replay the exact same piece-to-slot mapping.

For runtime play, each new game keeps the existing safe scatter slots / board exclusion area but randomly reassigns pieces to those slots. Startup, Reshuffle / Play again, and difficulty changes therefore produce a fresh visible arrangement without changing CutPattern geometry.

## State behavior

For v0.1, Preview / Hint / Board Lines settings persist for the lifetime of the running game across:

- Reshuffle / Play again,
- Relaxed / Standard / Hard difficulty changes,
- live Portrait / Landscape reflow.

The Preview card's manually dragged position is also retained during the runtime session and clamped into the viewport after size/orientation changes.

The settings are not yet persisted to disk because full Save / Resume belongs to Issue #3. When persistence is implemented there, all three player-aid settings should become part of saved puzzle state.

## Local smoke gate

Before merge, verify in Godot:

1. Normal play does not show the old permanent faint solved-image overlay on the puzzle board.
2. `Preview: On` shows a separate reduced floating reference card; `Preview: Off` hides it.
3. The Preview card stays screen-space during board Zoom / Pan and can be dragged away from pieces without leaving the viewport.
4. With `Hint: On`, picking a loose piece shows one approximate target region on the board and releasing the piece clears it.
5. The hint marker never moves or solves the piece; with `Hint: Off`, no target marker appears.
6. `Lines: On` shows faint internal piece boundaries on the board; `Lines: Off` removes them without affecting interaction.
7. Press Reshuffle repeatedly and confirm the visible starting piece arrangement changes each time.
8. Toggle all three aids to Off, then Reshuffle and switch difficulty; all three stay Off.
9. Toggle all three aids to Off, switch Landscape ↔ Portrait; settings and current puzzle state survive reflow and Preview remains in-bounds.
10. Cluster drag / merge / board snap, overlap picking, Zoom / Pan, and solved/off-board shadow behavior remain unchanged.
