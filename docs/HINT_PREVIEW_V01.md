# Hint / Preview / Board Lines v0.1

This document defines the first player-facing assistance contract for Issue #2.

## Product contract

### Preview

Preview is one compact three-state player aid:

- `Preview: Off` — no reference image is shown.
- `Preview: Float` — the complete source image appears in a separate reduced floating reference card in screen-space UI.
- `Preview: Board` — the complete source image appears as a very faint translucent mat directly on the puzzle board, underneath pieces and guidance layers.

The Preview button cycles `Off → Floating → Board → Off`.

Floating mode:

- stays screen-space during puzzle Zoom / Pan and does not alter board geometry;
- can be dragged to another part of the viewport when it obscures pieces;
- is clamped inside the current viewport after dragging or orientation changes.

Board mode:

- moves / zooms with the board because it is part of the board world;
- remains intentionally faint (`0.13` alpha in v0.1);
- stays underneath pieces, Hint, and Board Lines so it reads like a reference mat rather than an answer drawn over the player's work.

Preview never moves, snaps, solves, or selects a piece.

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
- Lines are drawn above the optional Board Preview mat and below real pieces.
- Lines are visual guidance only and never affect hit-test, snap, cluster, or solved state.
- With `Lines: Off`, the board is visually clean except for its outer frame and any explicitly selected Board Preview mat.

The controls are fully independent. A deliberate no-assistance challenge can use `Preview: Off + Hint: Off + Lines: Off`, including very large or panoramic puzzles.

## Reshuffle behavior

The base scatter generator keeps a fixed seed for reproducible regression geometry, but player-facing runtime reshuffles must not replay the exact same piece-to-slot mapping.

For runtime play, each new game keeps the existing safe scatter slots / board exclusion area but randomly reassigns pieces to those slots. Startup, Reshuffle / Play again, and difficulty changes therefore produce a fresh visible arrangement without changing CutPattern geometry.

## State behavior

For v0.1, Preview mode / Hint / Board Lines settings persist for the lifetime of the running game across:

- Reshuffle / Play again,
- Relaxed / Standard / Hard difficulty changes,
- live Portrait / Landscape reflow.

The Floating Preview card's manually dragged position is also retained during the runtime session and clamped into the viewport after size/orientation changes.

The settings are not yet persisted to disk because full Save / Resume belongs to Issue #3. When persistence is implemented there, Preview mode plus Hint / Board Lines should become part of saved puzzle state.

## Local smoke gate

Before merge, verify in Godot:

1. `Preview: Off` shows no reference image.
2. One Preview click enters Floating mode; the reduced reference card stays screen-space during board Zoom / Pan, can be dragged away from pieces, and stays inside the viewport.
3. The next Preview click enters Board mode; the floating card disappears and a faint complete image appears only on the puzzle board underneath pieces.
4. Board Preview follows Zoom / Pan and orientation reflow with the board, and remains compatible with Lines On / Off.
5. The next Preview click returns to Off and removes both reference forms.
6. With `Hint: On`, picking a loose piece shows one approximate target region on the board and releasing the piece clears it; Hint never moves or solves the piece.
7. With `Hint: Off`, no target marker appears.
8. `Lines: On` shows faint internal piece boundaries on the board; `Lines: Off` removes them without affecting interaction.
9. Press Reshuffle repeatedly and confirm the visible starting piece arrangement changes each time.
10. Preview mode / Hint / Lines choices survive Reshuffle, difficulty changes, and Landscape ↔ Portrait reflow.
11. Cluster drag / merge / board snap, overlap picking, Zoom / Pan, and solved/off-board shadow behavior remain unchanged.
