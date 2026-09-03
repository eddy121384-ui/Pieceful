# Pieceful Transition Fairing v0.1

Status: authoring experiment / pending local Godot smoke test and visual curation.

## Problem

The V15 crown and neck proportions became visually convincing, but the return from the tab feature to the shared ribbon could still read as several separately staged geometric events:

`Crown → Neck → Shoulder → Root → Ribbon → Junction`

V15 used several manually positioned guide points with independent depth multipliers. The resulting global spline remained continuous, but continuity alone did not guarantee visually fair curvature. The eye could still detect where the shoulder stopped, where the transition flattened, and where the ribbon resumed.

## V16 goal

Preserve the established crown / neck language and the shared global ribbon architecture while treating the return from the tab feature to the ribbon as one continuous fairing problem.

The intended visual model is:

`Tab feature → Shoulder / Root → fairing zone → Ribbon → Junction`

The feature offset should fade toward the ribbon instead of being assembled from unrelated return-point depths.

## Fairing model

V16 uses a normalized quintic smootherstep-shaped envelope for the additive tab offset on both sides of the feature.

For normalized transition parameter `u` in `[0, 1]`:

`q(u) = 6u^5 - 15u^4 + 10u^3`

The authoring `Transition Fairness` parameter blends between a direct linear progression and the quintic profile:

`fair(u) = lerp(u, q(u), transition_fairness)`

At full fairness, the analytic quintic profile has zero first and second derivative at its endpoints. The final stored cut is still produced by the existing global natural-cubic authoring pipeline, so this document describes the guide-shaping intent rather than claiming that the sampled final curve is an exact standalone quintic segment.

## Parameters

### Transition Length

Range: `0.55–1.00`
Default: `1.00`

Controls how much of the available run between Root and Junction participates in the fairing.

- Lower values: the feature returns to the ribbon sooner, leaving a longer comparatively neutral ribbon zone near the junction.
- Higher values: the transition begins farther toward the junction.
- `1.00`: the fairing conceptually uses the full available run to the junction.

### Transition Fairness

Range: `0.00–1.00`
Default: `0.90`

Controls how strongly the return follows the quintic easing profile.

- `0.00`: more direct / nearly linear feature-offset decay.
- `1.00`: strongest quintic fairing behavior.

These are authoring heuristics, not industry-standard measured values.

## Relationship to Shoulder Blend

`Shoulder Blend` and transition fairing are intentionally separate dimensions.

- `Shoulder Blend` controls the anatomical reach of the shoulder/root portion of the tab feature.
- `Transition Length` controls how far the recovery toward the ribbon extends.
- `Transition Fairness` controls the shape of that recovery.
- `Ribbon Curvature` remains the large-scale shared-cut-line motion and does not replace fairing.

## Preserved architecture

V16 preserves:

- V14 shared-edge topology optimization.
- V15 style parameters and seed-driven authoring behavior.
- V11 crown / neck guide levels.
- The global natural-cubic ribbon construction used since V9.
- Explicit validation and human approval before a CutPattern becomes a runtime asset.
- Runtime isolation: gameplay reads approved CutPattern JSON and does not run the authoring generator.

## Die Lab terminology

The V16 Die Lab uses the Pieceful canonical terminology from `docs/design/jigsaw_terminology.md`:

- Tab Depth
- Crown Width / Roundness
- Tab Asymmetry
- Shoulder Blend
- Ribbon Curvature
- Transition Length
- Transition Fairness

The informal nickname “mushroom” may still be used in conversation, but should not be used as the canonical UI / code / documentation vocabulary going forward.

## Smoke / visual gate

Before V16 is accepted as the new authoring baseline:

1. Open `authoring/die_preview.tscn` in Godot 4.6 and run F6.
2. Confirm `cut_pattern_generator_v16.gd` and `die_preview_v16.gd` parse successfully.
3. Compare the same seed at several Transition Fairness values.
4. Compare Transition Length at approximately `0.55`, `0.75`, and `1.00`.
5. Verify the Crown / Neck character did not regress.
6. Verify neighbouring shared edges remain exact.
7. Run validator checks across square, landscape, and portrait layouts.
8. Do not approve or replace the curated runtime CutPattern until the visual result is explicitly accepted.
