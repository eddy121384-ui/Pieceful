# Image-aware Difficulty Resolver v0.2

## Status

Implemented for Issue #37 on top of the integrated V0-05 runtime.

This layer promotes the earlier authoring-only `PuzzleLayoutResolver` into the runtime puzzle-selection flow while preserving the V16 die language and existing 1.6:1 saves.

## Product contract

Difficulty is a target amount of work, not a fixed piece count.

Runtime resolution is:

`source artwork -> aspect ratio -> difficulty target -> touch-aware grid -> CutPattern -> fixed game identity`

The player continues to choose semantic difficulties such as `Relaxed`, `Standard`, and `Hard`. The UI displays the actual resolved piece count for the selected artwork.

## Grid selection

`PuzzleLayoutResolver` still scores candidate integer grids by:

- distance from the target piece count
- average cell aspect ratio relative to a square cell
- deterministic orientation / count tie-breaks

Runtime integration adds:

- frame aspect support from `0.20` through `5.00`
- logical board-size input
- a minimum short-edge floor for touch/readability
- graceful count reduction when an extreme panorama / tall artwork cannot sustain the nominal target without producing thin pieces

The preferred cell-aspect band remains `0.82–1.22`. The current score still uses the established `5 × count_error² + 3 × cell_aspect_error²` heuristic.

## Board geometry

The puzzle board preserves the selected artwork aspect ratio with a 600-unit long edge.

- landscape: `600 × (600 / aspect)`
- portrait: `(600 × aspect) × 600`

The first runtime touch/readability floor is 24 logical units on the piece short edge.

Portrait / Landscape device rotation does **not** recalculate the grid. Resolution happens when a new game/difficulty is created. After that, the chosen CutPattern is part of the game identity and viewport changes only reflow the existing board/workspace.

## Existing 1.6:1 compatibility

Garden and Twilight Lake are both currently 960×600 = 1.6:1.

For that ratio the resolver intentionally reproduces the already approved production layouts:

| Difficulty | Target | Grid | Resolved | CutPattern |
| --- | ---: | ---: | ---: | --- |
| Relaxed | ~36 | 8×5 | 40 | `Classic_040_A` |
| Standard | ~144 | 15×10 | 150 | `Classic_150_A` |
| Hard | ~288 | 22×13 | 286 | `Classic_286_A` |

When those exact mappings resolve, runtime reuses the existing curated JSON rather than generating a replacement. This keeps pre-#37 `pattern_id` / piece-count saves compatible.

## New artwork ratios

For a non-legacy ratio, runtime generates the resolved V16 CutPattern lazily under:

`user://pieceful_patterns/`

The generated pattern id incorporates:

- content id
- a prefix of the artwork SHA-256
- difficulty id
- rows / columns
- frame aspect ratio

The V16 generator remains responsible for shared-edge geometry. The resolver only chooses the grid.

Generated pattern metadata records:

- resolver id `image_aware_runtime_v1`
- target and resolved counts
- rows / columns
- frame aspect ratio
- cell aspect ratio
- logical piece short edge
- touch-floor result
- layout score

## Save / Resume

Save Schema V1 remains additive. #37 adds:

- `puzzle.grid_columns`
- `puzzle.grid_rows`

Resume resolves the saved artwork and difficulty before applying piece positions, then validates:

- durable artwork identity
- piece count
- CutPattern id
- rows / columns when the new fields are present

Pre-#37 saves without explicit grid fields remain readable when their existing pattern id and piece count match the deterministic result.

## Player vs stress difficulties

`Stress · 400` and `Expert Stress · 576` remain available to direct developer / CI calls for scalability testing, but are no longer returned by the normal player-facing difficulty list.

The production selector currently exposes:

- Relaxed
- Standard
- Hard

Future Expert / higher difficulties should be promoted deliberately after device UX and performance validation rather than inheriting stress-test labels.

## Validation

The permanent image-aware resolver smoke covers:

- 1:1
- 4:3 / 3:4
- 16:9 / 9:16
- 4:1 / 1:4 extreme ratios
- minimum touch short-edge enforcement
- deterministic 1.6:1 compatibility with 40 / 150 / 286
- separation of player-facing and stress difficulties
- real runtime V16 generation for a synthetic 1:1 fixture
- save persistence of the resolved 22×13 grid and approved `Classic_286_A` identity

The existing autosave, multi-slot, corruption recovery, content identity, and two-artwork selection smokes continue to run before this test in normal CI.
