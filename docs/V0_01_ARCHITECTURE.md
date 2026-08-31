# V0-01 Architecture Map

```text
assets/demo_garden.svg
        ↓
PuzzleDefinition
  - grid 4×3
  - source cells
  - matching tab/slot edges
        ↓
PuzzleBoard
  - creates 12 PuzzlePiece nodes
  - scatters pieces
  - evaluates snap distance
  - tracks completion
        ↓
PuzzlePiece
  - Polygon2D face + UV
  - CollisionPolygon2D hit area
  - mouse/touch drag
  - snap tween
        ↓
Main
  - progress label
  - reshuffle
  - completion panel
```

Dependency direction is intentionally one-way: UI does not own puzzle rules, and content does not own interaction logic.
