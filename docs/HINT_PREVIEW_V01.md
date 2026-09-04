# Hint / Preview / Board Lines v0.1

This document defines the first player-facing assistance contract for Issue #2.

## Product contract

### Preview

- Preview is an explicit **On / Off** player setting.
- The solved image is fully hidden from the puzzle board during normal play.
- With `Preview: On`, the complete source image appears in a separate reduced floating reference card in screen-space UI.
- The floating reference does not zoom or pan with the puzzle board and does not alter board geometry.
- The card ignores pointer input so it never steals piece drag / pan gestures.
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

## State behavior

For v0.1, Preview / Hint / Board Lines settings persist for the lifetime of the running game across:

- Reshuffle / Play again,
- Relaxed / Standard / Hard difficulty changes,
- live Portrait / Landscape reflow.

The settings are not yet persisted to disk because full Save / Resume belongs to Issue #3. When persistence is implemented there, all three player-aid settings should become part of saved puzzle state.

## Local smoke gate

Before merge, verify in Godot:

1. Normal play does not show the old permanent faint solved-image overlay on the puzzle board.
2. `Preview: On` shows a separate reduced floating reference card; `Preview: Off` hides it.
3. The floating reference does not move with Zoom / Pan and does not block piece drag / pan input beneath it.
4. With `Hint: On`, picking a loose piece shows one approximate target region on the board and releasing the piece clears it.
5. The hint marker never moves or solves the piece; with `Hint: Off`, no target marker appears.
6. `Lines: On` shows faint internal piece boundaries on the board; `Lines: Off` removes them without affecting interaction.
7. Toggle all three aids to Off, then Reshuffle and switch difficulty; all three stay Off.
8. Toggle all three aids to Off, switch Landscape ↔ Portrait; settings and current puzzle state survive reflow.
9. Cluster drag / merge / board snap, overlap picking, Zoom / Pan, and solved/off-board shadow behavior remain unchanged.
