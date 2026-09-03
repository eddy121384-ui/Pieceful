# V16 Visual Baseline Candidate

Status: **visual baseline candidate — not yet an approved production die**.

This document records the V16 shape settings selected during Die Lab visual tuning. The values are now the default/reset state for the V16 Godot and browser/mobile authoring tools, but they do not by themselves create or approve a `CutPattern` asset.

## Reference candidate

- Target pieces: 36
- Resolved layout: 6 × 6 = 36
- Frame aspect ratio: 1.0000 (1:1)
- Seed: 424242

## Selected V16 shape baseline

| Canonical control | Die Lab token | Value |
| --- | --- | ---: |
| Tab Depth | `height` | 0.96 |
| Crown Width / Roundness | `round` | 0.93 |
| Tab Asymmetry | `asym` | 1.00 |
| Shoulder Blend | `blend` | 1.16 |
| Ribbon Curvature | `curve` | 0.60 |
| Transition Length | `translen` | 0.57 |
| Transition Fairness | `fairness` | 0.69 |

Source settings string:

`Piecepace Die Lab · 36 pieces · target 36 · aspect 1.0000 · grid 6x6 · seed 424242 · height 0.96 · round 0.93 · asym 1.00 · blend 1.16 · curve 0.60 · translen 0.57 · fairness 0.69`

## Meaning of baseline status

The baseline defines the current preferred V16 visual language. It is intentionally separate from curation/approval:

1. Opening V16 Die Lab starts with these values.
2. `Reset Shape` restores these seven values.
3. Explicit values pasted into Die Lab still override the defaults.
4. A candidate remains unvalidated while interactively tuning.
5. `Validate Candidate` must pass before `Approve JSON` is enabled.
6. No existing curated runtime asset is overwritten by selecting this baseline.

In particular, this document does **not** approve `Classic_036_A.json`, and it does not modify the historical `Classic_012_A.json` runtime regression asset.

## Validation before production approval

Before promoting this visual baseline into a first curated 36-piece die family, visually and mechanically check at least:

- 1:1 / ~36 pieces
- 16:9 / ~36 pieces
- portrait 3:4 or 2:3 / ~36 pieces
- at least one denser layout such as ~144 pieces
- several seeds beyond 424242
- full `CutPatternValidator` pass for any candidate chosen for approval
- shared-edge continuity and absence of self-intersections
- Crown / Neck character and Shoulder → Root → Ribbon → Junction fairing at the selected defaults

If those checks reveal a systematic issue, revise the V16 baseline values rather than silently compensating in runtime code.
