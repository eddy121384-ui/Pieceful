# Runtime Relaxed Milestone v0.1

## Goal

Graduate the playable runtime from the historical 12-piece regression fixture to the first ratio-aware player-facing Relaxed puzzle while preserving the approved-JSON runtime architecture.

## Why the current demo is 40 pieces, not exactly 36

The current demo artwork is `assets/demo_garden.svg`, whose native dimensions are 960x600, or exactly 1.6:1.

Player-facing `Relaxed` is an approximate target of 36 pieces. `PuzzleLayoutResolver` intentionally balances count error against individual-cell aspect distortion instead of forcing an exact count on every image.

For a 1.6:1 frame, the practical Relaxed layout is:

- target: ~36
- resolved grid: 8 columns x 5 rows
- resolved count: 40 pieces
- cell aspect: 1.0

Forcing an exact 6x6 grid would make each cell 1.6:1, outside the preferred 0.82-1.22 cell-aspect band. Therefore 40 pieces is the correct first runtime graduation target for this artwork.

The square 1:1 V16 baseline remains 6x6 = 36 pieces. `Classic_036_A` can still become the first curated square Relaxed die later; it is simply not the correct die for the current 1.6:1 demo artwork.

## Runtime preparation now implemented

`scripts/puzzle_board.gd` now:

- preserves the demo artwork's 1.6:1 board ratio;
- removes the old hardcoded list of 12 scatter positions;
- generates deterministic tray positions from the actual piece size and requested count;
- remains safe if future dense layouts exceed the available non-overlapping tray slots;
- prefers `res://cut_patterns/Classic_040_A.json` when that validated asset exists;
- otherwise falls back to the existing `Classic_012_A.json` regression asset;
- exposes the active pattern ID and piece count to the runtime HUD.

This means authoring can validate and approve `Classic_040_A.json` locally, then the next runtime startup/Reshuffle will automatically switch from 12 pieces to the Relaxed 40-piece asset without another code change.

## Authoring recipe for the first runtime candidate

In `authoring/die_preview.tscn`:

1. Keep the selected V16 baseline shape values:
   - Tab Depth 0.96
   - Crown Width / Roundness 0.93
   - Tab Asymmetry 1.00
   - Shoulder Blend 1.16
   - Ribbon Curvature 0.60
   - Transition Length 0.57
   - Transition Fairness 0.69
2. Set Frame aspect to Custom = `1.6000`.
3. Keep Difficulty target = Relaxed ~36.
4. Confirm resolver output is `8 x 5 = 40 pieces`.
5. Start with seed `424242`; visual inspection may reject it and choose another seed if needed.
6. Click `Validate Candidate`.
7. Only if the exact candidate is visually accepted and validator reports VALID, set Approved pattern ID to `Classic_040_A` and click `Approve JSON`.

Do not approve merely to unblock runtime testing. If the 1.6:1 candidate looks systematically weaker than the square baseline, fix or investigate the generator first.

## Runtime smoke gate after approval

Run `main.tscn` and confirm:

- HUD identifies `Classic_040_A` and 40 pieces;
- all 40 pieces spawn without index errors;
- artwork is not stretched relative to the 1.6:1 source;
- piece drag, neighbour snap, movable clusters, cluster-to-cluster merge and board anchoring still work;
- Zoom/Pan and 200-300% cluster dragging remain correct;
- Reshuffle returns to 40 independent loose pieces;
- the entire 40-piece puzzle can be completed.

## Scope boundary

This milestone does not yet implement arbitrary user image ingestion, save/resume, Museum Library, or panorama/scroll workspaces. It removes the final 12-piece-specific runtime assumption and proves the current interaction stack at the first ratio-aware player-facing difficulty.
