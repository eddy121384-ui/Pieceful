# Puzzle Piece Depth — Commercial Reference Study

Date: 2026-09-25  
Issue: #55  
PR: #54

## Decision

Piecepace should target a **paper-relief illusion**, not literal per-piece 2.5D geometry.

The visual goal remains **Quiet physical cardboard**, but the renderer should spend as little work as possible to create that perception.

## Reference set

Visual/product references reviewed:

- Easybrain — *Jigsaw Puzzles - Puzzle Games*  
  https://apps.apple.com/tc/app/jigsaw-puzzles-puzzle-games/id1324604053
- Jigsawscapes  
  https://apps.apple.com/tw/app/jigsawscapes-%E6%8B%BC%E5%9C%96/id1589762792
- Magic Jigsaw Puzzles  
  https://apps.apple.com/us/app/magic-jigsaw-puzzles-games-hd/id439873467

Scale context:

- Easybrain advertises puzzle sizes up to 400 pieces.
- Magic Jigsaw Puzzles advertises difficulty up to 1,200 pieces.

These products therefore provide useful visual references for a rendering style that must remain readable at high piece counts.

### Important evidence boundary

This is a **visual reference study**, based on public store screenshots and product pages. We do not have access to the competitors' rendering code, so this document does **not** claim that any specific competitor uses a particular shader, mesh, atlas, or batching implementation.

## Repeated visual cues observed

### 1. Directional edge contrast does most of the depth work

The piece is read as raised cardboard mainly because the contour has:

- a very narrow, soft light cue toward the upper-left;
- a slightly darker cue toward the lower-right;
- restrained contrast so artwork remains dominant.

The eye interprets this pair as relief even when no obvious side wall is visible.

### 2. Loose-piece height and cardboard thickness are different signals

Loose pieces receive a small lower-right contact-shadow cue.

Once a piece is solved, the floating cue becomes much weaker or disappears. The remaining seam is closer to a shallow pressed/cardboard relief than a floating tile.

### 3. Solved pieces converge back into the artwork

Commercial references avoid making the completed image look like a grid of thick tiles.

The visual hierarchy is:

1. artwork;
2. subtle piece relief/seam;
3. UI.

The completed image must not read as chocolate blocks, embossed buttons, plastic tiles, or a thick extrusion.

### 4. High-count readability favors cheap, stable cues

At high piece counts the player mostly needs:

- contour separation;
- a small orientation/depth cue;
- clear loose-vs-solved state.

A physically accurate bevel is not the product goal.

## What went wrong in the first #55 implementation

The first implementation made each piece significantly more expensive:

- far shadow Polygon2D;
- near shadow Polygon2D;
- thickness Polygon2D;
- artwork face Polygon2D;
- dynamically generated ArrayMesh bevel.

The bevel additionally built per-piece:

- contour normals;
- inset ring;
- inner UVs;
- directional vertex colors;
- triangle indices;
- an ArrayMesh resource.

This work is not needed every frame, but it is paid in bursts during startup/rebuilds. On mobile Web, particularly iPhone Safari, those synchronous bursts are visible.

The Rail also rebuilt its visuals on resize. Mobile browser startup can emit several viewport/safe-area resize changes, amplifying the cost.

## Revised Piecepace renderer

### Phase 1 — commercial-style 3-layer relief

Use only standard Polygon2D nodes:

1. **Warm rim** — tiny upper-left offset.
2. **Dark relief** — small lower-right offset; doubles as the loose-piece height cue.
3. **Artwork face** — unchanged source artwork.

Target: **3 render items per piece**, comparable to the original shadow + face + outline architecture, but without Line2D and without runtime geometry construction.

Loose state:

- warm rim: visible but quiet;
- dark relief: farther offset / slightly stronger.

Solved state:

- warm rim: reduced;
- dark relief: pulled close to the face and reduced;
- no floating contact-shadow look.

Rail, Sorting Tray and Timelapse use the same renderer and do not create separate bevel geometry.

### Phase 2 — optional mask/SDF renderer only if needed

If Phase 1 cannot visually reach the reference quality, evaluate a pre-baked mask/SDF atlas plus a shared CanvasItem shader.

Godot supports CanvasItem shaders, default texture/UV access, `TEXTURE_PIXEL_SIZE`, and per-instance shader parameters. That makes a shared mask-based relief renderer technically viable.

References:

- CanvasItem shaders:  
  https://docs.godotengine.org/en/latest/tutorials/shaders/shader_reference/canvas_item_shader.html
- ShaderMaterial / per-instance parameters:  
  https://docs.godotengine.org/en/latest/classes/class_shadermaterial.html

This is **not** the default next step. It must earn its complexity through visual QA and profiling.

## Performance rules

- No per-piece ArrayMesh bevel in normal runtime.
- No custom per-piece CanvasItem `_draw()` depth renderer.
- No resize-triggered destroy/recreate cycle when repositioning is sufficient.
- No separate heavy renderer for Rail / Tray / Replay.
- Visual cost must remain effectively O(piece count) with a small constant.
- A 286-piece puzzle must not pay for detail that is sub-pixel at the current display scale.

## Visual mantra

> **Paper relief illusion — make the eye believe the cardboard; do not make the GPU build the cardboard.**
