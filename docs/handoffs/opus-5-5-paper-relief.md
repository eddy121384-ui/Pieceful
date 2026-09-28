# HANDOFF — Opus 5.5 visual spike / Pieceful commercial paper relief

Date: 2026-09-28

Repository:
eddy121384-ui/Pieceful

Experiment branch:
exp/opus-5-5-paper-relief

Starting baseline:
b7a4a9385fb61124f81ec7cd1fd6e12d1fef6218

Main product PR:
#54 remains Draft.

Main issue:
#55 — V1-04A.1 Puzzle Piece Paper Relief

## Mission

Reproduce the MATERIAL READ of the attached Easybrain jigsaw screenshot as closely as practical in Pieceful, while preserving current interaction behavior and without meaningful performance regression.

The user will provide two visual references directly in the Opus conversation:

1. BENCHMARK: Easybrain screenshot.
   - Study only the puzzle-piece material treatment: face edge, bevel/highlight, grey cardboard side wall, contact shadow, anti-aliasing, and perceived thickness.
   - Do not copy UI, artwork, branding, composition, or proprietary assets.

2. ANTI-BENCHMARK: current Pieceful screenshot around 600% zoom.
   - Current rejected look reads as grey outline / highlighted contour.
   - Do NOT solve this by making an outline thinner, brighter, darker, or more directional.
   - The target should read as physical printed cardboard, not a stroked vector shape.

## Product state that is already accepted

This branch deliberately starts BEFORE the rejected directional-Line2D experiments.

Accepted at this baseline:

- iPhone Safari touch arbitration PASS.
- repeated pinch recovery PASS.
- overlap z-order isolation PASS.
- neutral grey cardboard Thickness accepted as closer to target.
- existing cheap renderer:
  - ContactShadow Polygon2D
  - Thickness Polygon2D
  - Face Polygon2D
  - Seam Line2D
  - 0 MeshInstance2D / ArrayMesh
- overlap rule:
  every visible component of upper Piece must render above every visible component of lower Piece.

Do not cherry-pick commits after the starting baseline from feat/issue-51-piece-depth unless you inspect them first. The later directional Line2D / inset-contour attempts were visually rejected.

## What you are free to change

You are specifically being asked to behave like a senior game rendering / technical-art engineer, not merely tune constants.

You MAY redesign the Face / material treatment if needed, including:
- CanvasItem shader on Face,
- shared shader/material strategy,
- alpha/mask-derived inner bevel,
- precomputed reusable edge information,
- a cheaper analytic approximation,
- removing or repurposing Seam if it helps.

You MAY change puzzle_piece_visual_factory.gd and add narrowly-scoped renderer helpers/tests.

Do not assume our previous proposed technique is correct. Start by visually decomposing the benchmark and explain the material model you think it uses.

## Frozen systems — do not touch

Do NOT modify:
- touch gesture arbitration,
- camera gesture behavior,
- hit padding,
- drag thresholds,
- Rail / Scatter behavior,
- snap / merge logic,
- save/resume,
- board ordering semantics,
- overlap z-order isolation,
- unrelated UI.

Touch-related files should remain byte-identical.

## Visual target

At normal play scale, the target should feel like a real printed jigsaw tile rather than a flat clipped image.

Important cues to investigate:

- no obvious uniform outline around the whole piece;
- printed artwork face remains visually dominant;
- extremely subtle face bevel / edge roll, apparently inside the face rather than an exterior stroke;
- upper-left light cue should be readable but not look like a white keyline;
- lower-right should transition naturally into grey cardboard side material;
- contact shadow should be soft and restrained;
- tabs and sockets must feel rounded/physical, not vector-stroked;
- anti-aliasing must remain clean on iPhone Safari;
- at 300–600% debug zoom the technique may become visible, but it should still not look like an obvious UI outline.

The final judgment is on visual resemblance, not on matching any one implementation theory.

## Performance is a hard requirement

Baseline benchmark around this accepted branch has been approximately:

- 40 pieces: ~10 ms piece construction
- 150 pieces: ~40 ms
- 286 pieces: ~75–80 ms
- 3 Polygon2D + 1 Line2D per piece
- 0 MeshInstance2D

CI timing has noise, so use these as engineering baselines, not exact absolute guarantees.

Required:
- no per-frame CPU contour rebuilds;
- no per-piece Viewport;
- no per-piece generated large texture;
- no O(n²) contour work per piece;
- no mesh explosion;
- 286-piece construction should remain in the same practical class as baseline, ideally <= 100 ms on the existing benchmark runner and in any case not materially slower;
- render-item count must not increase materially; reducing it is welcome;
- Web export / iPhone Safari must remain viable.

If a visually superior approach costs materially more, do NOT silently accept it. Report the tradeoff and try a cheaper variant.

## Required workflow

1. Inspect the attached Easybrain benchmark carefully before coding.
2. Inspect this branch at the baseline commit.
3. Explain your visual decomposition and likely rendering strategy briefly.
4. Implement ONE visual spike.
5. Add or update structural regression tests for the chosen material strategy.
6. Run:
   - puzzle_piece_depth_smoke
   - puzzle_piece_overlap_z_order_smoke
   - puzzle_piece_depth_benchmark
   - Rail visibility smoke
   - touch_gesture_arbitration_smoke
   - touch_zoom_recovery_smoke
   - touch_piece_pinch_handoff_smoke
   - full Web regression/export/browser runtime
7. Report 40/150/286 benchmark timings before asking for visual QA.
8. Deploy this experiment branch to Pages only after gates pass.
9. Give a cache-busted URL containing the exact deployed SHA.

## Visual QA request

Ask the user to compare side-by-side with the attached Easybrain reference, specifically:
- does the edge read as a bevel/material transition rather than an outline?
- does the printed face still dominate?
- does the grey side wall feel like cardboard?
- does it feel physically thick without looking like a drop-shadow sticker?
- has touch feel changed at all?

## Success condition

Do not optimize for “technically has bevel”.

Success is:
“at normal iPhone play scale, the user immediately feels this is much closer to the Easybrain material quality, while the 286-piece renderer remains effectively as cheap as the accepted baseline.”

If the first implementation misses the visual target, iterate visually before declaring completion, but keep each iteration isolated and benchmarked.

## Spike result (Opus 5.5)

### Benchmark decomposition
- Printed face runs all the way to the cut; there is no stroke anywhere.
- The bevel lives *inside* the face: a ~1–2% rounded roll where the artwork is
  re-lit — whitish sheen on upper-left-facing rims, multiplicative darkening on
  lower-right-facing rims, almost nothing on rims perpendicular to the light.
  That orientation dependence is why it never reads as an outline.
- Lower-right, the roll continues into a darker crease where face meets wall.
- Thin wall darker than the face; very weak soft table shadow.

### Why baseline failed
`Seam` was a uniform-width, uniform-colour antialiased Line2D centred on the
silhouette (= a vector stroke), and the flat light-grey offset `Thickness`
read as a second border against the dark table.

### Renderer
- `Seam` is replaced by `EdgeRelief`: the same Line2D slot, now a band centred
  on the cut drawn with one shared CanvasItem shader
  (`scripts/puzzle_piece_edge_relief.gdshader`).
- Line2D's UV.y is the across-cut coordinate (built in C++ at draw time); the
  shader derives the outward normal from derivatives of UV.y vs local position
  (y-flip / zoom / Rail-scale invariant) and applies N·L with a rounded
  profile that fades to zero at both band ends.
- `blend_premul_alpha`: output is `dst*(1-shade) + sheen`, so the artwork is
  always visible through the bevel; the band paints no colour of its own.
- One ShaderMaterial per state (loose / joined / solved), static and shared.
  Joined/solved have no outside crease (it would depend on sibling draw order).
- Band width and wall/shadow offsets scale with piece size (read O(1) from the
  PuzzlePiece parent; Rails reuse the last extent), so 286-piece tiles don't sit
  on a slab and the band stays below tight tab-neck radii.
- The closing duplicate contour point is dropped (native slice) and genuine
  kinks use a bevel joint (`sharp_limit`) to avoid band spikes.
- `puzzle_piece.gd`, touch, camera, Rail, snap, save files are untouched.

### Cost (local runner, 5 runs, median)
| pieces | baseline build | candidate build |
|---|---|---|
| 40 | 8–9 ms | 10 ms |
| 150 | 37 ms | 38 ms |
| 286 | 71 ms | 71 ms |

3 Polygon2D + 1 Line2D per piece, 0 MeshInstance2D, 0 viewports, 1 shared
relief ShaderMaterial per state (≤ 3 total), no per-piece texture/resource.
Steady frame time with 286 pieces on screen (llvmpipe): ~3 ms both.

### Visual QA
`tools/piece_relief_preview.gd` renders loose/overlapping/joined/solved
pieces through the live factory (needs xvfb + opengl3).
