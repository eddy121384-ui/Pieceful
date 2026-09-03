# Pieceful Content Library Architecture v0.1

Status: design checkpoint / not yet implemented

## Goal

Define where puzzle artwork lives, how the Godot client discovers and downloads it, how offline play works, and how the content system stays simple enough for a small team while still scaling to a large library.

The key decision is that the library is hybrid rather than purely local or purely remote.

## Core architectural decisions

1. Puzzle source images are not pre-cut into individual piece textures.
2. One full puzzle image is combined at runtime with an approved `CutPattern` asset.
3. Production puzzle artwork lives in cloud object storage and is delivered over HTTPS/CDN.
4. Recently used or explicitly downloaded puzzle images are cached persistently on the device.
5. A small starter library is bundled with the Godot app so first launch and offline play do not depend on the network.
6. Original master artwork is kept private and is not distributed to clients.
7. Catalog metadata is separate from image blobs.
8. Client code should depend on stable asset IDs, catalog metadata, URLs and versions, not on server folder layout.
9. Player-imported photos remain local by default.
10. Approved CutPattern JSON assets remain separate from the image library.

## Logical layers

### 1. Private master archive

Purpose: preserve original licensed, commissioned, photographed or otherwise acquired source artwork at maximum available quality.

Example:

```text
master/
  JP_kyoto_001_master.tif
  TW_alishan_001_master.jpg
```

Rules:

- private access only
- not referenced directly by the shipped game
- not exposed through public CDN URLs
- may contain higher resolution, different color profile or licensing metadata than the game derivative

### 2. Production content library

Recommended initial implementation: S3-compatible object storage such as Cloudflare R2, with CDN/HTTPS delivery.

The provider is an implementation choice, not an architectural dependency. The client contract should remain portable to another S3-compatible/object-storage provider later.

Example logical layout:

```text
production/
  catalog/
    catalog_v1.json
  thumbnails/
    jp_kyoto_001.webp
    tw_alishan_001.webp
  puzzles/
    jp_kyoto_001.webp
    tw_alishan_001.webp
```

The game should not infer behavior from these directory names. It should read catalog metadata.

### 3. Device cache

Godot stores downloaded production derivatives under `user://`.

Example:

```text
user://pieceful_cache/
  jp_kyoto_001_v3.webp
  tw_alishan_001_v1.webp
```

Cached images support:

- repeat play without re-downloading
- offline play for already downloaded puzzles
- lower bandwidth use
- faster reopen/resume

Cache eviction policy can be added later. v0.1 only requires version-aware persistent caching.

### 4. Bundled starter library

A small curated set ships inside the app.

Example:

```text
res://starter_library/
  starter_001.webp
  starter_002.webp
  ...
```

Purpose:

- immediate first-play experience
- graceful offline startup
- resilience if remote catalog/CDN is unavailable

Initial target can be roughly 10-30 starter puzzles; exact count is a product decision, not an architecture constraint.

## Image derivative pipeline

Do not ship master files directly.

Recommended pipeline:

```text
private master
    -> resize / crop policy / color conversion / compression
    -> thumbnail derivative
    -> puzzle derivative
    -> upload production assets
    -> update catalog metadata/version
```

Suggested derivative classes:

### Thumbnail

Used for library browsing.

Typical target: approximately 256-400 px on the long edge.

### Puzzle image

Used by the actual puzzle scene.

Typical target: approximately 1600-2500 px on the long edge initially; final values should be validated against target device memory, zoom behavior and future high-piece-count modes.

### Master

Original/highest-quality source. Private only.

## Catalog

v0.1 does not require a database.

A versioned JSON catalog is sufficient for an initial library ranging from hundreds into low thousands of assets, and can later be partitioned by collection/category if needed.

Example:

```json
{
  "version": 1,
  "puzzles": [
    {
      "id": "jp_kyoto_001",
      "title": "Kyoto Evening",
      "categories": ["japan", "city"],
      "orientation": "landscape",
      "aspect_ratio": 1.5,
      "thumbnail_url": "thumbnails/jp_kyoto_001.webp",
      "image_url": "puzzles/jp_kyoto_001.webp",
      "image_version": 3,
      "premium": false
    }
  ]
}
```

Possible later split:

```text
catalog/index.json
catalog/new.json
catalog/nature.json
catalog/japan.json
catalog/animals.json
```

The Godot client should care about metadata fields and stable IDs, not object-storage folder names.

## Version-aware cache behavior

Every production puzzle derivative should have an `image_version` or equivalent immutable content version.

Example:

```text
catalog says jp_kyoto_001 version 4
local cache has jp_kyoto_001 version 3
    -> local entry is stale
    -> download version 4
    -> replace/update cache record
```

This allows artwork fixes or recompression without an app-store release.

A content hash can be added later if stronger integrity/deduplication guarantees are needed.

## Runtime load flow

Recommended initial flow:

```text
App starts
  -> load bundled starter catalog immediately
  -> load cached remote catalog if present
  -> request current remote catalog
  -> merge/refresh visible library metadata

Library screen
  -> request thumbnails only for visible/near-visible entries

Player selects puzzle
  -> check local puzzle-image cache/version
  -> if current: load local file
  -> if missing/stale: download production puzzle image
  -> persist to cache
  -> combine full image with approved CutPattern
  -> create puzzle pieces via polygon/UV runtime path
```

The client never downloads pre-cut per-piece artwork.

## Relationship to the virtual-die architecture

The image library and die library are deliberately independent.

Example:

```text
jp_kyoto_001.webp + Classic_036_C.json -> 36-piece puzzle
jp_kyoto_001.webp + Classic_100_G.json -> 100-piece puzzle
```

Therefore 1,000 source images across five supported piece counts do not require 5,000 image sets.

Storage remains approximately:

```text
1,000 full puzzle images
+ thumbnails
+ a relatively small approved CutPattern library
```

This separation is a major reason to keep CutPatterns as reusable virtual dies rather than baking piece images per puzzle.

## Player photos

Player-imported photos should be local-only by default.

Initial behavior:

```text
user photo
  -> local import
  -> optional local derivative/cache
  -> combine with approved CutPattern
  -> local save/progress
```

Do not upload personal photos merely to make the feature work. Cloud backup/sync would be a separate future opt-in product decision.

## What not to build in v0.1

Avoid introducing infrastructure before product requirements demand it:

- no custom always-on application server
- no PostgreSQL requirement
- no Redis requirement
- no GraphQL requirement
- no Firebase requirement solely for catalog delivery
- no server-side piece cutting
- no per-piece image asset library

Static/versioned metadata plus object storage is sufficient for the first implementation.

## When a real backend/database becomes justified

Introduce an application API/database when one or more of these become real product requirements:

- user accounts
- cross-device save sync
- favorites synchronized between devices
- subscriptions/entitlements that cannot rely solely on platform receipts/client state
- personalized recommendations
- server-driven experiments
- content scheduling requiring richer editorial workflows
- UGC/public sharing
- social/community features
- moderation
- server-authoritative events or rewards

Do not add these systems pre-emptively.

## Initial provider recommendation

Cloudflare R2 is the current preferred first implementation because it is S3-compatible and well suited to serving downloadable static assets without requiring a custom server.

This is a recommendation, not a hard dependency. The architectural contract is:

```text
object storage + HTTPS/CDN + versioned catalog + local persistent cache
```

## Source-of-truth split

```text
Artwork source of truth:
  private master archive

Production delivery source of truth:
  object storage + catalog metadata

Virtual-die source of truth:
  approved CutPattern JSON assets

Player progress source of truth in v0.1:
  local device save

Player-imported photo source of truth in v0.1:
  local device
```

## Open questions for later validation

- exact puzzle derivative resolution per target platform
- WebP vs JPEG/AVIF support/performance policy in Godot targets
- maximum local cache size and LRU/explicit-download behavior
- whether offline downloads are automatic, manual, or both
- thumbnail prefetch window for mobile library scrolling
- catalog partitioning threshold
- signed/private URLs vs public production derivatives
- content licensing metadata and takedown workflow
- seasonal/editorial collection schema
- future cloud save/account architecture

These questions do not block the v0.1 architectural decision.
