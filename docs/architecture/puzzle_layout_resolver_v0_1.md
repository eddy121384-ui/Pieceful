# Puzzle Layout Resolver v0.1

## Status

Implemented on the `feat/v0-01-godot-core-jigsaw` authoring branch.

This document records the layout policy used by the Piecepace Die Lab. It is a design heuristic, not a claim about a universal commercial jigsaw standard.

## Goal

A puzzle difficulty should describe an approximate amount of work, not force the same exact piece count onto every image aspect ratio.

The resolver converts:

`frame aspect ratio + difficulty target -> columns x rows -> resolved piece count`

The chosen grid should stay close to the requested difficulty while keeping the average puzzle cell reasonably close to square.

## Player-facing difficulty targets

The current targets are:

| Difficulty | Target pieces |
| --- | ---: |
| Relaxed | ~36 |
| Casual | ~72 |
| Standard | ~144 |
| Hard | ~288 |
| Expert | ~576 |
| Extreme | ~1000 |

The resolved count may differ. For example, a wide image may resolve a ~36 target to 40 pieces if that produces much healthier piece proportions than forcing an exact 36-piece grid.

`12` pieces is intentionally not a player-facing difficulty. The existing 12-piece runtime asset remains useful as a fast regression / smoke-test fixture.

## Supported authoring aspect presets

The first Die Lab presets are:

- Square 1:1
- Landscape 4:3
- Photo 3:2
- Wide 16:9
- Portrait 3:4
- Portrait 2:3
- Custom aspect ratio

Custom authoring ratios are currently clamped to 0.50–2.00.

The resolver only needs an aspect ratio. The eventual image crop system can therefore calculate a crop frame first and pass the resulting ratio into the same resolver without coupling crop coordinates to die generation.

## Resolver heuristic

For every candidate `columns x rows` layout, calculate:

- resolved piece count = `columns * rows`
- cell aspect ratio = `frame_aspect_ratio * rows / columns`
- logarithmic piece-count error from the difficulty target
- logarithmic cell-aspect error from an ideal value of 1.0

The current score is:

`5 * count_error^2 + 3 * cell_aspect_error^2`

A preferred cell-aspect band of `0.82–1.22` is searched first. A deterministic fallback can search outside that band if a future custom format cannot find a candidate.

Tiny tie-breakers prefer the board's natural orientation and the candidate closer to the requested count.

The scoring constants are product heuristics and may be tuned after visual / usability testing.

## Current bounds

- target pieces: 36–1200
- rows / columns search: 2–64
- preferred cell aspect: 0.82–1.22

These are authoring limits, not a promise that every count in the range is suitable for runtime on every device.

In particular, ~1000-piece runtime needs separate performance, zoom/pan, hit-testing, save/resume, and loose-piece UX validation before it should be exposed as a launch difficulty.

## Separation of responsibilities

`PuzzleLayoutResolver` owns grid selection.

`CutPatternGenerator V15` owns the actual shared-edge die geometry and style parameters.

`Die Lab` owns human authoring, preview, validation, and explicit approval.

Runtime continues to consume approved CutPattern JSON assets only.

This separation is intentional: changing difficulty policy should not mutate the mushroom / ribbon geometry language, and tuning the die style should not require hard-coding new piece-count presets.

## Authoring metadata

Generated candidates now record layout provenance under `authoring.layout`, including:

- resolver version
- difficulty id
- target piece count
- resolved piece count
- rows / columns
- frame aspect ratio
- aspect class
- cell aspect ratio
- layout score

This makes an approved die reproducible and auditable even when the requested difficulty count and final piece count are not identical.

## Future crop integration

Expected upstream flow:

`source image -> CropSpec -> puzzle frame aspect ratio -> PuzzleLayoutResolver -> CutPatternGenerator -> approved CutPattern`

The crop system should store normalized crop coordinates independently from the die. The same source image can therefore be used with different crops, difficulty levels, and approved virtual dies without duplicating pre-cut image assets.
