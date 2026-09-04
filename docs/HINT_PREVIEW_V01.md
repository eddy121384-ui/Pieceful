# Hint / Preview v0.1

This document defines the first player-facing assistance contract for Issue #2.

## Product contract

### Preview

- Preview is a **press-and-hold reference action**.
- The solved image is fully hidden during normal play.
- While the player physically holds `Hold Preview`, the complete source image is shown over the board.
- Releasing the control hides the reference immediately.
- Preview never moves, snaps, solves, or selects a piece.

### Hint

- Hint is an explicit **On / Off** player setting.
- Normal runtime defaults to `Hint: On`.
- With Hint On, picking an unsolved piece temporarily highlights only its approximate target cell / board region.
- The hint does **not** show the exact cut outline and never moves or solves the piece.
- Releasing the piece hides the target region.
- With `Hint: Off`, no target marker is shown at all. There is no idle timer, automatic rescue, or forced hint after the player has been stuck for a long time.
- Preview remains available independently of the Hint setting.

This separation allows normal players to keep gentle guidance while allowing deliberate no-hint challenges, including very large or panoramic puzzles.

## State behavior

For v0.1, Hint On / Off persists for the lifetime of the running game across:

- Reshuffle / Play again,
- Relaxed / Standard / Hard difficulty changes,
- live Portrait / Landscape reflow.

The setting is not yet persisted to disk because full Save / Resume belongs to Issue #3. When persistence is implemented there, the current Hint setting should become part of the saved puzzle state.

## Local smoke gate

Before merge, verify in Godot:

1. Normal play no longer shows the old permanent faint solved-image preview.
2. Holding `Hold Preview` shows the complete reference image; releasing it hides the image immediately.
3. With `Hint: On`, picking a loose piece shows one approximate target region on the board and releasing the piece clears it.
4. The hint marker does not move or solve the piece.
5. With `Hint: Off`, picking and dragging pieces never shows a target marker.
6. Toggle Hint Off, then Reshuffle and switch difficulty; Hint stays Off.
7. Toggle Hint Off, switch Landscape ↔ Portrait; Hint stays Off and the current puzzle state still survives reflow.
8. Cluster drag / merge / board snap, overlap picking, Zoom / Pan, and solved shadow behavior remain unchanged.
