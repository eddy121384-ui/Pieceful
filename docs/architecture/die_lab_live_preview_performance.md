# Die Lab live-preview performance architecture

Status: design checkpoint / implemented on the V0-01 authoring branch.

## Problem

The Godot Die Lab originally used the full authoring pipeline for every style-slider update:

`slider -> generator init -> V14 topology search -> full geometry -> CutPatternAsset -> full validator -> draw`

That is correct for approval, but wasteful for interactive tuning. V14 topology is deterministic from `seed + rows + columns` and is unaffected by V15/V16 style parameters, while full validation performs production checks that do not need to run on every live preview frame.

The browser/mobile Die Lab felt much faster because its interactive path is closer to `generate geometry -> draw SVG`; it does not run the full Godot production validator after each slider input.

## Implemented split

### Live Preview

Used when shape sliders change.

`style params -> V16 geometry -> CutPatternAsset -> draw`

Rules:
- reuse cached V14 topology when `seed + rows + columns` are unchanged;
- do not run `CutPatternValidator` automatically;
- mark the candidate as `not validated`;
- disable `Approve JSON` until a full validation succeeds;
- show preview generation time and topology cache HIT/MISS in the Die Lab.

### Full Validation

Triggered explicitly by `Validate Candidate`.

`current preview candidate -> CutPatternValidator -> valid/invalid result`

Rules:
- a successful validation enables `Approve JSON`;
- any subsequent geometry/layout/seed change invalidates that validation and disables approval again;
- approval remains an explicit human action.

## Topology cache

`scripts/cut_pattern_generator_v14_cached.gd` wraps the existing V14 optimizer without changing its scoring/output semantics.

Cache key:

`seed : rows : columns`

Cached values:
- horizontal shared-edge polarities;
- vertical shared-edge polarities;
- topology rhythm score.

The cache is process-local and bounded; it is authoring acceleration only and is not a runtime asset cache.

## Non-goals

This change does not:
- alter V14 topology scoring;
- alter V15/V16 geometry;
- skip validation before approval;
- change runtime approved-JSON behavior;
- guarantee that very large layouts such as ~1000 pieces are fully real-time.

If very large previews remain slow after this split, the next optimization target is geometry/render batching rather than topology search or validator scheduling.
