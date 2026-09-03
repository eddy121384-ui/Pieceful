# Runtime Zoom / Pan v0.1

Status: implemented on the V0-01 runtime branch; pending local Godot 4.6 smoke test.

## Why this is core infrastructure

Zoom and pan are not museum-only extras. They become basic interaction requirements as piece counts increase and are mandatory for extreme-aspect artwork such as panoramas, hanging scrolls, and full handscroll challenges.

The runtime should therefore treat the puzzle table as a navigable world rather than assuming that all playable content permanently fits inside one 1280×720 screen.

## Architecture

`main.tscn` now owns a `PuzzleCamera` (`Camera2D`) controlled by:

`res://scripts/puzzle_camera_controller.gd`

The puzzle board and pieces remain in world coordinates. HUD controls remain in a `CanvasLayer`, so the HUD does not scale or move with the puzzle camera.

### Content-bounds contract

The camera accepts a world-space `content_rect`.

Current 12-piece regression gameplay returns the historical 1280×720 workspace from `PuzzleBoard.navigation_bounds()` so the initial view remains compatible with the existing vertical slice.

Future artwork may return a much wider or taller content rect. A full handscroll can therefore use a world rectangle many screens wide without changing camera code.

`Fit` computes a scale that fits the entire current `content_rect` into the viewport, clamped to the camera's supported zoom range.

## Controls

### Desktop / mouse

- Mouse wheel up/down: zoom around the cursor.
- Middle-mouse drag: pan.
- Right-mouse drag: pan.
- `−` / `+`: zoom around the viewport center.
- `Fit`: fit the full content bounds.
- Left-mouse drag remains reserved for puzzle-piece dragging.

### Touch

- Drag a puzzle piece with one finger as before.
- One-finger drag on empty space: pan.
- Two unclaimed touches on empty space: pinch to zoom and translate to pan.

A touch is provisionally observed by the camera so empty-space gestures are possible. If an `Area2D` puzzle piece claims that pointer, `PuzzleBoard` cancels that pointer in the camera controller. This prevents a piece drag and camera pan from competing for the same touch.

## Camera-aware piece dragging

Before Camera2D, `PuzzlePiece` could assign viewport `event.position` directly to world `global_position` because the world and screen coordinates were effectively identical.

That is no longer valid after zoom or pan.

`PuzzlePiece` now converts input positions through:

`viewport.canvas_transform.affine_inverse()`

before updating the piece world position. This is required for accurate dragging at arbitrary camera scale and offset.

Snap testing remains in world coordinates and is therefore independent of camera zoom.

## Zoom model

Initial constants:

- minimum zoom: `0.10×`
- maximum zoom: `6.00×`
- wheel/button step factor: `1.12×`

These are product defaults, not universal jigsaw standards. The low minimum is intentional so future extreme-aspect content can still offer a whole-artwork overview.

Cursor-anchored zoom keeps the world point beneath the cursor stable while zooming, subject to content-bound clamping.

## V0.1 non-goals

This layer does not yet implement:

- inertia / kinetic scrolling
- elastic overscroll
- minimap / navigator strip
- double-tap zoom presets
- camera persistence in save files
- automatic content bounds for future 36/144/1000-piece runtime layouts
- museum handscroll segmentation or artwork ingestion

Those should build on this camera/content-bounds contract rather than bypass it.

## Local smoke gate

Run `main.tscn` in Godot 4.6 and verify:

1. Initial 12-piece layout still opens centered and playable.
2. Wheel zoom changes the HUD percentage and zooms around the cursor.
3. `−`, `+`, and `Fit` work.
4. Middle/right mouse drag pans after zooming in.
5. Camera cannot pan the entire workspace permanently off-screen.
6. At 150%, 200%, and 300% zoom, left-dragged pieces remain directly under the cursor.
7. Piece snap distance behaves identically regardless of zoom.
8. Reshuffle does not reset or corrupt the camera state.
9. On touch hardware, a piece drag does not also pan the camera.
10. On touch hardware, empty-space one-finger pan works.
11. On touch hardware, two-finger empty-space pinch zoom/pan works.
12. Completion UI remains screen-fixed and readable at all zoom levels.

Keep PR #16 Draft until these runtime interaction checks and the existing Die Lab / V16 gates pass.
