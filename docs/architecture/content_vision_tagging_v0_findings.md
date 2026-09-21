# Pieceful — Met 40-image Vision Tagging v0 Findings

Source: clean 40-image Met manifest generated 2026-09-18T21:27:47Z + uploaded image ZIP.

## Result

- 40/40 images visually inspected; 40 unique image assets.
- Exact keyword/query match: 23/40 (57.5%).
- Partial semantic match: 11/40 (27.5%).
- Clear mismatch: 6/40 (15.0%).
- Conclusion: provider search query is suitable for candidate discovery, but must not be treated as taxonomy ground truth.

## Query-by-query stress result

| Query | Match | Partial | Mismatch | Key observation |
|---|---:|---:|---:|---|
| landscape | 5 | 0 | 0 | Cleanest query in this sample. |
| flowers | 3 | 2 | 0 | Flower-shaped jewelry and a flower-titled rural scene broaden the result set. |
| animal | 0 | 4 | 1 | Four animal-shaped artifacts are art/culture objects; the rifle is a text-hit false positive. |
| portrait | 5 | 0 | 0 | All five visually contain portraits. |
| architecture | 0 | 5 | 0 | Results are mostly design studies/allegories, not architectural scenes/places. |
| night | 1 | 0 | 4 | Only Night Scene is actually a night scene; Night Table/Night cap dominate the false positives. |
| Japan | 4 | 0 | 1 | Four are genuinely Japan-related; 'Japan lamp for ceiling' does not support Japanese cultural content. |
| still life | 5 | 0 | 0 | All five are visually valid still lifes. |

## Taxonomy stress findings

1. `ingestion_query` must remain provenance/debug metadata only; never auto-promote it into category, subject, scene, or region/culture.
2. Object/artifact semantics need priority over incidental words or depicted motifs. Example: the animal-shaped statuettes are `art_culture` with `subject=animal`, not primary category `animals`.
3. Scene tags must be visual. `night` cannot be inferred from titles such as `Night Table` or `Night cap`.
4. Region/culture tags must use explicit source evidence or clear place evidence; the string `Japan` in a product/design title is insufficient by itself.
5. Architecture needs a distinction between architectural scene/place and architecture-as-allegory/design-study. Current open `subject` can express this, but the primary category should not automatically become `places`.

## Manual-review queue

- `met_12802` — Summer Flowers: Flower subject is present by title/source, but the visual is dominated by a rural landscape with figures.
- `met_774277` — Wheellock Rifle: The query hit 'animal' through source text/creator wording; the pictured object is a wheellock rifle.
- `met_226943` — Portrait: The portrait is embedded in a textile/decorative object; category 'people' is based on dominant visible content.
- `met_399581` — Architecture: Architecture is represented as an ornamental/design study, not as an architectural scene.
- `met_202696` — Architecture: The title is Architecture, but the visual is a sculpted allegorical relief with figures.
- `met_353912` — Japan lamp for ceiling: The word 'Japan' is in the source title, but the image/source metadata do not support Japanese cultural content.

Full per-image draft was generated as an authoring review artifact; do not promote it to the shipped catalog until review is complete.
