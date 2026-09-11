# Gallery Metadata & Local State v0.1

## Goal

Issue #4 introduces the first content-discovery layer without coupling discovery data to puzzle save files or to the image asset bytes themselves.

The product flow becomes:

`Gallery catalog -> choose artwork -> image-aware difficulty resolver -> puzzle runtime -> local save`

Discovery metadata remains separately editable:

`res://content/catalog_v1.json`

## Catalog contract

The catalog root versions three independent concepts:

- `schema_version`: structural compatibility of the catalog document.
- `metadata_version`: semantic revision of content metadata fields.
- `tag_schema_version`: interpretation/versioning of weighted tags.

Each content entry includes stable runtime identity fields:

- `id`
- `label`
- `source_id`
- `path`

and discovery metadata:

- `category`
- `subject`
- `region_culture`
- `mood`
- `visual`
- `style`
- `scene`
- `puzzleability`
- `suggested_difficulty`
- weighted `tags`
- `attribution` including license/source placeholders

The file path is not the durable save identity. Existing SHA-256 content identity remains authoritative for save/resume compatibility.

## Search and filters

The first Gallery search index is intentionally local and deterministic. It searches the title/id plus category, subject, region/culture, mood, visual, style, scene, suggested difficulty, and tag ids.

The first filter dimensions are:

- theme/category
- state: All, Favorites, Continue, Completed, New

This is enough to validate discovery behavior without pre-committing to recommendation ranking (#8).

## Local Gallery state

`user://pieceful_gallery_state_v1.json` stores only cross-session discovery/profile state:

- favorite content ids
- completed content ids
- completion count
- completed difficulty ids
- last completion timestamp

This state is deliberately separate from puzzle saves.

`Continue` is not duplicated into Gallery state. It is derived from the existing unfinished-game index and durable `content_source_id`, so the save system remains the sole source of truth for resumable games.

When a puzzle is completed, the unfinished save slot is still retired exactly as before; Gallery records the completion independently before that retirement.

## Portrait fixture

`Crane & Pine Scroll` is a synthetic 600×800 (3:4) official test fixture. Its purpose is to exercise the product path that the two historical 960×600 fixtures could not:

- metadata discovery
- portrait artwork cards
- image-aware difficulty resolution at a non-1.6 aspect ratio
- runtime V16 CutPattern generation for the resolved portrait grid
- normal save/content identity handling

It is a project fixture, not a claim to reproduce or represent a specific historical artwork.

## Current product behavior

Clean boot and Start New both open the Gallery surface. Artwork cards expose Favorite and state copy. A resumable artwork gets a Continue action that routes through the existing multi-slot resume path.

Selecting an artwork still refreshes the difficulty chooser with the actual image-aware resolved piece counts. Screen rotation does not recut an existing puzzle.

## Deferred

- remote CMS / downloads
- large catalog virtualization
- recommendation/ranking (#8)
- cloud profile sync
- user-imported photo picker
- rich museum attribution presentation
- semantic/AI content analysis
