# Pieceful Content Metadata Completeness Contract v0.1

Status: Issue #9 Phase 1 companion contract

## Principle

Every catalog image uses the same semantic dimensions, but completeness does **not** mean inventing a value for every dimension.

For the six facet dimensions — `subject`, `region_culture`, `mood`, `visual`, `style`, and `scene` — every published entry must contain both:

1. the facet array itself; and
2. a matching value in `facet_status`.

This lets Pieceful distinguish three different states instead of collapsing them into an empty string or a fake catch-all tag.

## Facet status

Allowed authoring states:

- `present` — the dimension meaningfully applies and the facet array contains at least one value.
- `not_applicable` — the dimension does not meaningfully apply; the facet array is intentionally empty.
- `unresolved` — authoring has not decided yet; the facet array is empty and the entry is not ready to publish.

Published catalog entries may use only `present` and `not_applicable`. `unresolved` is an authoring workflow state and CI rejects it from the shipped catalog.

The consistency rule is strict:

- `present` => non-empty facet array
- `not_applicable` => empty facet array
- `unresolved` => empty facet array

Values may never coexist with `not_applicable` or `unresolved`.

## Publication requirements

`category` is always required and must contain exactly one controlled primary category.

The following facets must be `present` in published catalog content because every playable image should have enough information to describe what the player sees and how the image is visually constructed:

- `subject`
- `visual`
- `style`

The following facets may be `present` or `not_applicable`:

- `region_culture`
- `mood`
- `scene`

Examples:

- A generic synthetic garden can have `region_culture: []` with `facet_status.region_culture = "not_applicable"`.
- An abstract geometric image may have `scene: []` with `facet_status.scene = "not_applicable"`.
- A newly imported image whose cultural attribution has not been reviewed can temporarily use `facet_status.region_culture = "unresolved"`, but it cannot enter the published catalog until review resolves it.

Do not use values such as `global`, `unknown`, `neutral`, or similar filler merely to make a field non-empty. Such values are valid only when they carry actual semantic meaning defined by the taxonomy.

## Non-facet completeness

Every published entry must also contain:

- stable runtime identity: `id`, `label`, `source_id`, `path`
- `category`
- the complete `puzzleability` metric block
- `suggested_difficulty`
- weighted `tags` backed by category/facets
- human-authoritative `attribution` / licensing fields

`puzzleability` is always fully populated because it represents measurable image structure rather than optional semantic interpretation.

## Why this exists

The future batch importer and AI-assisted tagger must be able to say "I do not know yet" without silently fabricating metadata. Search and recommendation code must also be able to distinguish "this dimension does not apply" from "this image has not been reviewed".

The catalog therefore treats metadata completeness as an explicit state machine rather than a requirement to fill every box with a guess.
