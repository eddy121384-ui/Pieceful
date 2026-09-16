# Pieceful Content Taxonomy v0.1

Status: Issue #9 Phase 1 design checkpoint

## Goal

Turn the loose Gallery metadata introduced in Issue #4 into a stable authoring contract that can support three later jobs without inventing a different vocabulary for each one:

1. Gallery search and player-facing filters.
2. Batch import / AI-assisted tagging during content production.
3. Local recommendation scoring in Issue #8.

The taxonomy is intentionally small. Pieceful should have enough structure to answer product questions and find similar puzzles, without becoming a museum database or requiring runtime AI.

## Compatibility

The runtime catalog remains `schema_version = 1`. Existing Godot code already treats discovery metadata as flexible dictionaries, so Phase 1 does not require a runtime migration.

This checkpoint bumps:

- `metadata_version` to `2`
- `tag_schema_version` to `2`
- adds `taxonomy_version = 1`

The machine-readable vocabulary lives at:

`res://content/tag_taxonomy_v1.json`

## Field roles

### Identity / runtime

These are stable runtime fields and are not tagging output:

- `id`
- `label`
- `source_id`
- `path`

`id` and `source_id` must remain stable after publication. File paths are not durable save identity.

### Primary category

`category` is one player-facing browse bucket, not a complete description of the image.

Allowed v1 values:

- `nature`
- `animals`
- `places`
- `art_culture`
- `food`
- `objects`
- `people`
- `abstract`

A category should answer: **where would a player reasonably expect to browse for this image?**

It is deliberately broad. More specific meaning belongs in facets.

### Subject

`subject` contains concrete things visibly present in the image, for example:

`garden`, `flowers`, `lake`, `mountains`, `crane`, `train`, `castle`

Subject IDs are open vocabulary but canonical: lowercase snake_case ASCII, no synonyms duplicated inside one entry, and stable once published.

### Region / culture

`region_culture` describes meaningful geographic or cultural association, for example:

`japan`, `taiwan`, `east_asia`, `france`, `mediterranean`, `global`

It is not a guess from visual stereotypes. Automated tagging may propose values, but ambiguous cultural attribution requires human review.

### Mood

Mood is a small controlled vocabulary describing the emotional tone of the artwork:

`calm`, `cozy`, `joyful`, `dreamy`, `contemplative`, `mysterious`, `dramatic`, `romantic`, `nostalgic`, `playful`, `energetic`, `melancholic`

Use at most four values. Mood is for discovery and recommendation, not a psychological claim about the player.

### Visual

`visual` describes objective composition traits useful for both discovery and puzzle behavior:

`clear_regions`, `detailed`, `fine_texture`, `repetitive_texture`, `negative_space`, `flat_areas`, `strong_edges`, `soft_gradients`, `high_contrast`, `low_contrast`, `colorful`, `muted`, `monochrome`, `symmetrical`

These labels should describe the image, not whether a human likes it.

### Style

Controlled v1 values:

`photo`, `illustration`, `digital_art`, `painting`, `watercolor`, `oil_painting`, `ink`, `print`, `poster`, `collage`

Use the smallest accurate set. For example an ink-inspired digital illustration may legitimately be `["ink", "illustration"]`.

### Scene

Scene describes environmental context rather than subject identity:

`indoor`, `outdoor`, `day`, `night`, `dawn_dusk`, `urban`, `rural`, `wilderness`, `waterside`, `architectural`, `still_life`

This intentionally avoids duplicating arbitrary nouns already represented by `subject`.

## Puzzleability

`puzzleability` is a normalized 0..1 feature block.

Required metrics:

- `score`
- `clear_regions`
- `repetitive_texture`
- `flat_area`
- `landmark_density`
- `color_variety`
- `edge_density`
- `gradient_area`

`score` is **not difficulty**. A higher score means the image has clearer and more varied visual structure that generally gives the player useful solving cues.

The individual metrics exist so later difficulty logic does not depend on one opaque number. They can initially be authored manually, then produced by an offline analysis tool and reviewed.

`suggested_difficulty` remains one of:

- `relaxed`
- `standard`
- `hard`

It is a recommendation for first presentation, not a restriction on what the player may choose.

## Weighted tags

The `tags` array is the compact ranking representation used later by recommendation/search scoring.

A weighted tag must already exist in the entry's category or facets. Do not create a second shadow vocabulary only inside `tags`.

Example:

```json
{"id": "japan", "weight": 0.9}
```

Weights are in `[0, 1]`.

Default guidance:

- category: `1.0`
- subject: `1.0`
- region/culture: `0.9`
- style: `0.8`
- mood / visual: `0.7`
- scene: `0.6`

These are authoring defaults, not a frozen recommendation algorithm.

## Attribution

Every official catalog entry keeps:

- `creator`
- `license`
- `source_url`

Optional fields:

- `license_url`
- `attribution_required`

Licensing metadata is human-authoritative. An AI tagger may never invent or overwrite rights information.

## AI tagging policy

Runtime AI is out of scope.

The future import pipeline may use a vision model during authoring to propose:

- subject
- mood
- visual
- style
- scene
- puzzleability metrics

Human review remains authoritative for:

- title / label
- primary category when ambiguous
- region/culture when ambiguous
- all licensing / attribution fields
- any field manually locked by an editor

A re-run must merge new machine suggestions without silently overwriting human corrections.

## Validation strategy

Phase 1 uses the three existing synthetic fixtures to prove the contract:

- Garden
- Twilight Lake
- Crane & Pine Scroll

They are deliberately different in composition, mood, region/culture and puzzleability.

The next phase should validate this taxonomy against roughly 30-50 intentionally diverse real candidate images before the taxonomy is treated as frozen. If many images require awkward exceptions, change the taxonomy before building the batch tagger.

## Non-goals in Phase 1

- no remote catalog
- no CDN/storage implementation
- no recommendation ranking
- no Gallery redesign
- no runtime vision model
- no automatic legal/licensing inference
- no attempt to enumerate every possible subject or place

The goal is a stable shared language for content, not maximum metadata.
