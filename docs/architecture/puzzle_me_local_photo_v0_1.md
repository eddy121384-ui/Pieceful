# Puzzle Me local-photo architecture v0.1

## Product contract

Puzzle Me lets a player turn a local photo into a normal Pieceful puzzle without creating a second puzzle engine.

The photo is private by default and is copied into Pieceful's local app storage. Runtime puzzle generation, difficulty resolution, CutPattern generation, save/resume, trays, camera, completion, and Gallery state continue to use the existing product paths.

## Content-source boundary

Official content remains defined by the versioned resource catalog:

- `res://content/catalog_v1.json`
- source kind: `builtin`

Puzzle Me content is intentionally not appended to that catalog. It is stored in a local registry:

- `user://pieceful_puzzle_me_v1.json`
- canonical media: `user://puzzle_me/<sha256>.png`
- source kind: `local_photo`
- source id: `local_photo:<sha256>`

`PuzzleMeGalleryBoard` merges both sources only at the existing content API boundary. Downstream puzzle systems therefore do not need to know whether the artwork came from the bundled catalog or a player photo.

## Import pipeline

All platform pickers converge on `PackedByteArray`.

1. Player selects an image.
2. Decode PNG, JPEG, or WebP.
3. Preserve the full image aspect ratio; no automatic crop is applied.
4. If the long edge exceeds 4096 px, resize to a maximum 4096 px long edge.
5. Encode a canonical PNG.
6. SHA-256 the canonical PNG bytes.
7. Deduplicate by fingerprint.
8. Persist the canonical PNG into the app sandbox.
9. Persist local-photo registry metadata.
10. Surface the imported image as normal Gallery content and pass its native aspect ratio into the image-aware difficulty resolver.

Canonicalization makes save identity independent of the original file URI and avoids requiring renewed photo-library permission on resume.

## Platform picker strategy

Native builds use `DisplayServer.file_dialog_show()` when native file dialogs are available.

Web builds cannot use a Godot `FileDialog` to access arbitrary host files. The Web path therefore uses `JavaScriptBridge` to create a hidden HTML file input, reads the selected file through `FileReader` as an `ArrayBuffer`, converts it to `PackedByteArray`, and then enters the shared import pipeline.

Platform-specific code ends at the byte boundary.

## Durable identity

Puzzle Me reuses content identity v1:

- `identity_version`
- `source_kind = local_photo`
- stable `source_id`
- SHA-256
- `content_key = sha256:<digest>`

The save stores this identity exactly like official content. On resume:

1. the local registry resolves the saved `source_id` back to a local photo;
2. the current local file bytes are fingerprinted;
3. the existing durable-content guard verifies that the current bytes still match the save identity;
4. the existing image-aware difficulty/grid/CutPattern preflight runs;
5. the normal multi-slot runtime state is restored.

Missing or changed local photo bytes must not silently restore onto another image.

## Gallery integration

Imported photos are surfaced as ordinary Gallery cards with synthetic discovery metadata:

- category: `my_photos`
- visual/style: photography
- tags: `my-photo`, `puzzle-me`, `personal`
- suggested difficulty: Standard
- attribution: player photo stored locally

Search, Favorites, Continue, Completed, and image-aware difficulty counts therefore use the same Gallery behavior as official content.

## Presentation

Photo decode / resize / canonical PNG encoding can take noticeable time for large images. Import is wrapped by the existing loading curtain with `Preparing your photo…`, and the UI yields a frame before synchronous image work begins so the loading state can actually render.

## Validation

Permanent CI coverage includes:

- Puzzle Me store smoke: canonical local persistence, SHA identity, deduplication, registry reconstruction.
- Puzzle Me flow smoke: portrait player photo import, real image-aware Standard puzzle generation, durable multi-slot save, whole-app reconstruction, and resume of the same local content identity / CutPattern / piece count.
- All pre-existing save, content identity, Gallery, resolver, and startup/resume presentation smokes remain required.

## Current v0.1 limitations

- Supported decoded input formats are PNG, JPEG, and WebP.
- HEIC / HEIF is not yet guaranteed; a platform/browser decode fallback should be added before claiming full modern photo-library coverage.
- No manual crop/editor yet; v0.1 preserves the entire selected image and fits the puzzle board to its aspect ratio.
- No cloud upload or sync.
- No sharing or public user-photo catalog.
- No AI analysis, enhancement, generation, or tagging of private photos.
- Deleting an imported photo from the Puzzle Me library is supported by the store layer but is not yet exposed as product UI in this slice.
