# Realistic Box Dump / Face-Down Pieces

Status: design note / future feature

## Product idea

Real physical jigsaw puzzles often begin with a setup phase: pieces are poured from the box, overlap, rotate, and may land face-up or face-down. Most mobile jigsaw games remove this friction entirely. Pieceful may preserve it as an optional realism feature rather than the default experience.

Suggested setup presets:

- Clean: pieces are face-up and neatly arranged outside the board.
- Loose: pieces are face-up but scattered, rotated, and may overlap.
- Box Dump: pieces are scattered, rotated, overlapping, and a configurable share begin face-down.

Possible advanced controls:

- Scatter pieces
- Random rotation
- Overlap pieces
- Random face-down
- Face-down ratio

This should remain opt-in. Casual players should not be forced through extra setup work.

## 2D implementation concept

The feature does not require one animation per piece shape. Flip animation belongs to the piece transform, not to the polygon silhouette.

Suggested hierarchy:

```text
PieceRoot
└── FlipRoot
    ├── Polygon2D
    ├── Shadow / visual effects
    └── collision / interaction visuals
```

Dragging / board rotation operate on `PieceRoot`. Flipping operates on `FlipRoot`.

A shared flip animation can tween the local X scale:

```text
+1.0 -> 0.0 -> -1.0
```

At the midpoint, switch front/back rendering. Ending at negative X scale also mirrors an asymmetric piece silhouette, which matches the handedness change of a physical piece flipped over.

The front uses the puzzle source image and existing UV mapping. The back can use one shared cardboard-back material or texture across all pieces.

Optional visual polish can include a small temporary Y-scale change, shadow offset, slight rotation, z-order raise, and eased timing. A future shader can add fake perspective without requiring 3D meshes.

## Gameplay rules to test

- Face-down pieces can be dragged, sorted, and placed in trays.
- Face-down pieces cannot snap into the solved board.
- Flipping should temporarily block conflicting drag input.
- Initial mobile interaction should prefer an explicit Flip action over a gesture that conflicts with dragging; double-tap can be tested later as a shortcut.
- Overlap, hit-testing, z-order, and selection ergonomics are likely harder UX problems than the flip animation itself.

## Architecture fit

This feature works naturally with the virtual-die architecture. Every approved CutPattern already produces a polygon boundary. The same generic flip system works for every generated or curated shape, including asymmetric pieces.

The feature is not part of the current V0-01 merge gate and should be implemented later as an optional Realistic Setup / Box Dump mode.