# Catalog content pipeline

Implemented from `perf/web-startup-content-delivery` at
`4ea7eca8644dfb105eefe7b2d782b9dd664dd614` on
`tools/catalog-content-pipeline`. Evidence collected 2026-10-06, Asia/Taipei.
This is offline authoring/build tooling. The accepted gameplay, renderer,
Gallery, My Photos and save schema have no product changes.

## 1. Architecture and existing-system audit

The authoritative authoring registry embeds the **existing schema-1 runtime
catalog entries**, plus source, derivative, provenance and rights records.
It generates the existing runtime JSON and license inventory; there is no
second runtime catalog format. A separate append-only identity lock records
the stable ID's original bytes, source ID and runtime path. This deliberate
independent lock catches accidental source replacement, including coordinated
edits to generated hashes. Git-baseline checks protect already committed locks.

Current migration: 38 entries, consisting of 35 Met JPEG artworks and 35 JPEG
thumbnails, plus `garden`, `twilight_lake` and `crane_pine_scroll` SVG fixtures.
Migration preserves **every current ID, source ID, raw SHA256, resource path,
title, metadata field, order and original derivative**. The existing
`content/catalog_v1.json` and `licenses/ASSET_MANIFEST.json` remain byte-identical.
Catalog metadata version 3, taxonomy version 1 and tag schema version 2 remain
unchanged. Browse, Search, Themes, Favorites, For You, History and Setup keep
their current entry shape and dynamic catalog loading.

The current taxonomy's category, six facets/statuses, weighted tags,
puzzleability metrics and suggested difficulty remain the contract. Difficulty
and actual cut compatibility are resolved by the accepted runtime, not a new
pipeline geometry implementation. Current museum metadata and local curator
records remain evidence; `content/runtime/met_v0_manifest.json` is a frozen
legacy 35-artwork asset/provenance snapshot, not a second live catalog to edit.
The former museum materializer now refuses to overwrite a pipeline-managed
catalog; its historical offline validation/self-test remains available.

All artwork remains bundled. Intake, authoring, examples, Python dependencies,
tests and the editor export plugin are excluded from production packs. The
export plugin emits the same virtual runtime identity manifest as the accepted
performance branch; duplicate raw catalog artwork is still absent from exports.

## 2. Directories and installation

| Location | Purpose |
| --- | --- |
| `content-intake/<batch>/batch.json` + images | Ignored operator input; `.gdignore` prevents editor import |
| `tools/catalog_pipeline.py`, `tools/catalog_pipeline_lib/` | CLI, validation, image preparation, transaction handling |
| `tools/catalog_pipeline_requirements.txt` | Authoring-only Pillow 12.3.0 and NumPy 2.3.5 |
| `tools/catalog_pipeline_examples/met_sample/batch.json` | Complete, offline example metadata |
| `content/curation/catalog_authoring_v1.json` | Authoritative entries, provenance, rights and inventory template |
| `content/curation/catalog_identity_lock_v1.json` | Immutable source/identity and legacy derivative locks |
| `content/curation/catalog_identity_manifest_v1.json` | Generated build-time mapping of resource path to original SHA256 |
| `content/curation/catalog_assets_v1.json` | Generated dimensions, formats, sizes, hashes and derivative profiles |
| `content/catalog_v1.json` | Generated existing runtime catalog |
| `licenses/ASSET_MANIFEST.json` | Generated inventory; **inventory is not legal clearance** |
| `assets/catalog/puzzles/<id>.png` or `.jpg` | New approved full artwork, copied byte-for-byte |
| `assets/catalog/thumbs/<id>.png` | New deterministic Gallery derivative |
| `.pieceful-content/catalog-pipeline/` | Ignored lock, durable transaction journal and recovery backups |
| `build/catalog-pipeline/*.json` | Ignored machine-readable operator/CI reports |

Use Python 3.12 (validated environment) in a virtual environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r tools/catalog_pipeline_requirements.txt
python3 tools/catalog_pipeline.py validate
```

After dependencies are installed, validation and ingestion require no network.
The current repository has already been migrated; do **not** rerun `migrate`.
That one-time command refuses an already managed repository. Godot 4.7.2 and
its verified templates are needed for import/export/runtime acceptance, not
for offline Python ingestion. Keep private contracts/evidence outside Git;
store an appropriate durable reference rather than confidential text in records.

## 3. Input metadata format

An intake directory contains UTF-8 `batch.json` with
`{"schema_version": 1, "items": [...]}` and local source files. Each item has:

| Field | Contract |
| --- | --- |
| `id`, `title`, `source_file`, `source_id` | Stable ID, visible title, relative intake image path, unique provider/reference identity |
| `creator`, `date` | Text/year when known; `null` when unknown (creator becomes the runtime's existing empty-string unknown) |
| `provider`, `source_reference` | Provider and durable acquisition/source reference; source URL can supply the latter |
| `source_url`, `credit_line`, `license_url` | Known URL/reference/credit or explicit `null`; required where rights/attribution demand them |
| `license`, `attribution_required` | Explicit license token and boolean; no implicit ownership |
| `rights` | Kind, status, evidence, reviewer/decision and three explicit grants, described below |
| `provider_rights_signal` | Optional existing Met-compatible `isPublicDomain=true` signal; not a substitute for review |
| `taxonomy` | Existing category and facets: `subject`, `region_culture`, `mood`, `visual`, `style`, `scene` |
| `tags` | Optional existing `{id, weight}` array; references must belong to the item's category/facets |
| `puzzleability`, `suggested_difficulty` | Optional existing metrics/difficulty; otherwise current offline analyzer supplies them |
| `puzzleability_review` | Explicit reviewer/rationale required if analysis flags image suitability concerns |
| `collection_id`, `pack_id`, `sort_order` | Optional grouping IDs and unique nonnegative integer order |
| `expected_source_sha256` | Optional approved lowercase 64-character raw SHA256; strongly recommended to bind approval to bytes |

See the committed [complete example](../tools/catalog_pipeline_examples/met_sample/batch.json).
For new project-owned artwork the rights object has this shape, filled with
**actual** decisions rather than example claims:

```json
{
  "kind": "PROJECT_OWNED",
  "status": "APPROVED",
  "evidence_reference": "your durable ownership/commission record reference",
  "review": {
    "reviewer": "your responsible reviewer",
    "decision_reference": "your recorded approval reference"
  },
  "commercial_use": true,
  "redistribution": true,
  "derivatives": true
}
```

`facet_status` can be omitted from intake: populated arrays yield `present`,
empty arrays yield `not_applicable`; required published facets must be present.
Category/controlled facets/difficulty come from `content/tag_taxonomy_v1.json`.
Tags default deterministically to category and facets with existing weighting
guidance. No semantic categories, creator, date or legal grants are inferred
from pixels. Unknown fields (including unimplemented crop/focal directives)
are rejected instead of silently ignored. Duplicate JSON keys/nonfinite numbers
are rejected. New items default to appended order after sorting batch IDs;
explicit unique `sort_order` supports curator ordering.

## 4. Stable ID rules

IDs are lowercase ASCII snake case, start with a letter and are at most 80
characters. `source_id` is a unique, stable `provider:reference`; My Photos
identities are not accepted as built-in catalog sources. Neither filenames nor
hashes choose IDs. Renaming an intake file with unchanged ID/bytes does not
change runtime paths, hashes or player identity. Repeating the same batch
produces no changes. Duplicate source hashes produce a visible warning; they
do not silently collapse explicit IDs. Duplicate IDs or source identities fail.

For a committed ID, original bytes, runtime path and source ID cannot change.
There is no `--force` hash rewrite. Validation compares the current lock to Git
`HEAD` by default; CI additionally compares the PR base/push predecessor.
Reviewers must retain that meaningful baseline, not erase history to bypass it.

## 5. Rights and provenance rules

Kinds: `CC0`, `PUBLIC_DOMAIN`, `PROJECT_OWNED`, `LICENSED`, `UNKNOWN`.
States: `APPROVED`, `REVIEW_REQUIRED`, `REJECTED`.
New items require `APPROVED`, a known kind, nonempty evidence/reviewer/decision
references and explicit `commercial_use`, `redistribution`, `derivatives=true`.
CC0 requires `license=cc0`; public domain requires `public_domain`; owned work
requires `owned`/`commissioned`. Required attribution requires credit and
license references. `project_fixture`, unknown and unverified licenses do not
constitute clearance. Provider and source reference are always required.

These checks validate declarations and local evidence consistency, **not
authenticity, worldwide copyright status or counsel's judgment**. There is no
network downloader and a URL never grants permission. Eddy/the rights reviewer
must verify the actual file, territories, commercial distribution, derivative
and attribution obligations before setting approval. Keep the approved-byte
hash and a durable evidence reference together.

Existing Met approvals inherit recorded CC0 and `isPublicDomain=true` plus
local curator acceptance; they are not new legal clearance or live museum
reverification. Five existing suitability decisions are
`accepted_curator_override`; their preserved recorded curator decisions are
valid, not invented new rights. Inherited eligibility checks require the same
original source hash, URL and qualifying local public-domain evidence.

The three original SVG fixtures remain `UNKNOWN/REVIEW_REQUIRED`, with narrowly
locked unchanged entries. This migration does not silently remove accepted
content or invent ownership. Ordinary CI validates this explicit legacy state
and warns. The strict **whole-catalog** release gate is:

```sh
python3 tools/catalog_pipeline.py validate --production-rights
```

It currently exits **2**, naming `garden`, `twilight_lake` and
`crane_pine_scroll`. Establish genuine ownership/distribution evidence and
reviewed rights for them, then regenerate; until then legal release clearance
remains blocked. The gate is scoped to catalog artwork, not every font/UI asset
or the broader release audit. Future new `REVIEW_REQUIRED` items never inherit
these exceptions.

## 6. Image and thumbnail generation

New sources: single-frame PNG or JPEG (`.png`, `.jpg`, `.jpeg`) whose bytes
match the extension and fully decode. Supported modes are RGB/RGBA/L/LA/P;
provide approved RGB/sRGB files for reliable presentation. CMYK, animated files,
WebP, HEIC, GIF and new SVG are rejected. Only the three locked legacy SVGs
retain existing semantics. Empty sources, nonpositive dimensions, sources over
64 MiB or over 40 megapixels fail before expensive decoding. These are tooling
safety limits, **not proof that maximum-size images fit every target GPU**.
Artwork dimensions/color/ICC appearance still require Godot/device review.
EXIF rotation must already be normalized before approval; this pipeline refuses
to rewrite identity-bearing bytes or silently rotate approved artwork.

Full artwork is copied byte-for-byte, without normalization, resampling or
recompression. The current Setup preview uses full artwork; no separate setup
derivative is introduced. New Gallery thumbs contain the image proportionally,
without cropping/stretching/upscaling, longest edge at most 420 px, using integer
half-up dimensions and pinned Pillow Lanczos. Output is RGBA PNG without codec
metadata; fixed stored-DEFLATE encoding removes zlib compression-version
differences. A square thumb can be about 706 KB of source PNG; this is an
authoring byte cost, not imported Godot size, CDN transfer or GPU allocation.

Generated dimensions/format/byte count/SHA256/profile are recorded and validation
recomputes derivatives. Existing 35 museum JPEG thumbnails are frozen unchanged
to preserve accepted pixels; recomputing from their already processed production
JPEGs would alter them. Pinned tooling and recomputation detect output changes;
cross-OS/CPU/codec wheel equivalence beyond the tested Linux environment is not
claimed. Use the pinned CI authoring environment if another machine differs;
do not casually update profiles/dependencies and rewrite derivatives.

## 7. Hash and runtime identity generation

SHA256 is always over original approved file bytes, not decoded pixels,
thumbnail bytes or imported `.ctex` data. The registry/lock produce
`content/curation/catalog_identity_manifest_v1.json`. The editor-only export
plugin validates this mapping against all actual original source bytes and emits
`res://content/catalog_identity_v1.json` virtually into PCK/APK/AAB, preserving
the performance branch's mapping and removal of duplicate raw artwork.
The existing runtime obtains built-in hashes from that compact manifest.
My Photos continues hashing its real `user://` files exactly as before.

All 38 original digests are checked in Web and Android packs. Old saves use
unchanged source kind/source ID/digest/geometry parameters; no schema migration
is needed. Keep old sources/catalog entries available for existing progress and
completed history, even when publishing a reviewed replacement under a new ID.

## 8. Batch ingest and transaction safety

Close the Godot editor and stop arbitrary builds before promotion. Official
Web/Android export helpers hold the same catalog lock through validation/export,
so ingest cannot race those builds. Direct editor/Godot exports are outside
that Python lock: run full validation before them and avoid concurrent writers.

```sh
python3 tools/catalog_pipeline.py ingest content-intake/batch-001 \
  --report build/catalog-pipeline/batch-001.json
python3 tools/catalog_pipeline.py validate
```

The entire batch and current shipping catalog validate before promotion.
Outputs are staged on disk; original inputs are hash-observed and rechecked;
only changed files are replaced. A durable journal and per-file backups protect
promotion. Handled I/O failures roll back; a crash/interruption leaves recoverable
backups and blocks validation/export until:

```sh
python3 tools/catalog_pipeline.py recover
python3 tools/catalog_pipeline.py validate
```

Recovery refuses to overwrite unexpected external edits. Preserve journal and
backups and inspect manually if recovery reports a conflict. This is transaction
rollback plus cooperating locks, **not multi-file filesystem atomicity for
arbitrary readers**, Git commits or power-loss guarantees for every filesystem.
No source or current catalog is promoted if item 47 of 50 fails validation.

Reports print `ADDED`, `UNCHANGED`, `UPDATED`, `BLOCKED`, `WARNING` with ID,
title, source, rights and hash. JSON adds generated paths, dimensions, per-item
asset information, planned changes, rejection reasons, `ok`, `dry_run` and
`promoted`. In a rejected batch, valid items are **proposals only**;
`promoted=false` is decisive. Reports are restricted to external JSON files or
repository `build/`/`.pieceful-content/`, so they cannot overwrite inputs.

## 9. Dry run and deterministic regeneration

```sh
python3 tools/catalog_pipeline.py ingest content-intake/batch-001 --dry-run \
  --report build/catalog-pipeline/batch-001-dry-run.json
python3 tools/catalog_pipeline.py generate --dry-run
python3 tools/catalog_pipeline.py generate
```

Dry run uses temporary staging and changes no shipping files. Generated JSON
uses stable ordering and contains no run timestamps. `validate` requires all
projections to be fresh; `generate` is the explicit action to refresh projections
after a deliberate registry metadata/inventory edit. Identical second runs have
zero diffs. Complete Godot containers may still vary in generated class/UID
metadata; pipeline determinism does not assert whole-PCK byte determinism.

## 10. Validation failures

Exit 0 means valid; exit 2 means blocked. Failures include duplicate IDs/source
references/JSON keys, missing files/title/provenance/grants, invalid rights,
corrupt/unsupported images, changed old bytes, invalid/incorrect approved hash,
stale manifests/dimensions/derivatives, invalid taxonomy/tag/difficulty references,
unresolved required facets, traversal/symlinks/case collisions, existing generated
file or `.import` collisions, duplicate order, interrupted transactions and
modified baseline identity locks. Duplicate hashes warn, rather than guessing
that two deliberately different IDs are identical player content.

Check existing entries as well as intake. Do not hand-edit generated catalogs,
identity manifests or derivative hashes to quiet a failure. Correct approved
inputs/authoritative metadata, regenerate deliberately, inspect the report/diff,
then run runtime acceptance.

## 11. Updating an existing artwork

For metadata-only updates, provide a complete item with existing ID/source ID
and identical approved source bytes, or edit its authoritative registry metadata
then run `generate`. Rights and taxonomy are revalidated. Existing artwork and
derivatives remain frozen. To replace artwork bytes, **retain the old entry and
source**, assign a new reviewed stable ID/source ID (for example a revision),
then ingest that as new content. Any hiding/removal or old-save migration is a
separate product/migration decision, not an override shipped here.

## 12. Adding one artwork and safe demonstration

Create `content-intake/<batch>/batch.json` with one complete reviewed item and
its approved PNG/JPEG, run dry-run, inspect the report, ingest, validate, then
Godot import/runtime/export checks and Git review. Never derive identity from
an incoming filename. Generated source and thumbnail files belong in the commit;
intake/private evidence does not.

The safe example references already bundled, recorded-CC0 Met 10181 bytes:

```sh
python3 tools/catalog_pipeline.py example --output content-intake/example
python3 tools/catalog_pipeline.py ingest content-intake/example --dry-run
python3 tools/catalog_pipeline.py demo --output build/catalog-pipeline-demo \
  --godot "$GODOT_BIN"
```

`demo` creates an isolated allowlisted project, ingests an explicit duplicate
alias, generates its thumbnail/hash, imports it and verifies the real Gallery
card, selection and playable puzzle. It uses isolated user data and does not
pollute the shipping catalog. Existing demo outputs are preserved; choose a
fresh output directory to rerun. `example` prepares intake only; do not promote
the sample alias into production merely for demonstration.

## 13. Adding 50 or 100 artworks: Eddy's operational workflow

For 100 legally cleared files tomorrow, prepare **one directory** with all
approved PNG/JPEG bytes and **one `batch.json` containing 100 items**. For each,
assign a stable ID/source ID/title, actual provider/source reference, known
creator/date or explicit unknowns, reviewed category/facets, real license,
attribution obligations, evidence/reviewer/decision and commercial/distribution/
derivative grants. Bind approval to `expected_source_sha256`. Optional collection/
pack/order groups them. Use the complete example as the shape, not its legal
facts. Analyzer supplies numeric metrics/tags unless explicitly reviewed values
are supplied; suitability warnings require a curator's rationale. Do not turn
all low-suitability warnings into blanket automatic overrides.

After installing pinned tooling, the same single batch workflow handles 1, 50
or 100 items, with no per-item GDScript/resource/manifest edits:

```sh
python3 tools/catalog_pipeline.py ingest content-intake/eddy-100 --dry-run \
  --report build/catalog-pipeline/eddy-100-plan.json
# Review the planned changes, rights, duplicate warnings and suitability.
python3 tools/catalog_pipeline.py ingest content-intake/eddy-100 \
  --report build/catalog-pipeline/eddy-100-result.json
python3 tools/catalog_pipeline.py validate
```

Then import with the locked Godot editor, inspect Gallery/artwork/actual puzzle
and attribution on target devices, run relevant regressions and official Web/
Android exports, review artifact size/memory/startup, and commit the approved
registry/locks/generated manifests/catalog/inventory/artwork/derivatives together
for PR/CI review. Tooling validation is not device, visual or legal release
approval. The unchanged legacy three-fixture production-rights blocker remains
until separately resolved.

## 14. CI and local acceptance

`catalog-content-pipeline.yml` validates all entries offline, compares immutable
identities to the Git base, checks clean regeneration, and runs focused valid
single/100-item batch, rights, paths, image, hash, idempotency and rollback tests.
It does not require museum/network service availability. Toolchain installation
still requires ordinary package/Godot downloads unless cached.
`release-readiness.yml` installs pinned authoring tools, validates before exports,
keeps accepted native/browser/Android checks and runs the isolated playable
sample. Export inspection rejects intake/tooling/raw-duplicate leakage.

Local evidence collected on this branch:

- Focused pipeline tests: 33, including malformed facets, revoked inherited
  public-domain evidence and a writer blocked by the export mutex.
- Accepted native regressions: all 36 suites passed (identity/save/resume,
  Gallery/selection, photos, completion/history/replay, renderer/touch/Rail,
  release guard and other existing suites).
- Existing release Python tests 7/7, legacy content ingestion smoke passed,
  catalog packaging tests 4/4; isolated native generated sample passed.
- Actual Chromium production-ready and four startup/failure/storage checks;
  all 38 accepted Web journey assertions passed with 54 captures and no browser
  runtime errors. Same-origin old-export upgrade verifies all 38 original hashes,
  museum/photo saved progress and completed history, with unchanged discrete
  state and normalized position drift under 1e-6 (also observed in the old
  build's own save round trip).
- Production Web and unsigned Android APK/AAB exported and inspected; all 38
  original-byte hashes/imported artworks verified, zero duplicate raw sources.
  Android release flag, package/permissions, notices, 16 KB native alignment,
  APK zip alignment and AAB bundletool checks passed. Signing/store ingestion/
  native device validation remain outside this cloud result.

The local exports were built from the implementation working tree based on
4ea7eca; their `build-info` truthfully records the parent SHA plus dirty sources.
They are not certification of a clean final commit's hosted CI run. Native
headless tests retain existing teardown warnings; no claim of universal zero
orphan/resource leakage is made. See
[measurement evidence](catalog-pipeline-evidence/measurements.json) for exact
artifact and browser results.

## 15. Future content-pack compatibility and size

`collection_id`, `pack_id` and explicit order are metadata preparation only.
They do not implement hosting, download, availability, entitlement or cache
eviction. Current Gallery builds all catalog cards and current exports bundle
all approved content. A 100-item ingestion test proves tooling scale, **not**
that 138 full artworks meet browser startup/memory budgets. Future large batches
need artifact/runtime/device measurement and the separately documented content
delivery decision. No online-only assumption or remote dependency was added.

Current shipping art/derivatives and Web raw sizes are unchanged:

| Artifact bytes | Accepted performance base | Pipeline implementation |
| --- | ---: | ---: |
| Web `index.*` raw delivery | 55,667,593 | 55,667,593 |
| PCK | 15,816,400 | 15,816,400 |
| WASM | 39,514,754 | 39,514,754 |
| Unsigned Android APK | 39,047,892 | 39,047,912 |
| Unsigned Android AAB | 39,036,955 | 39,037,005 |

The Android +20/+50 bytes are container compression/metadata differences;
decompressed comparison permits only import UID values, same script-class
record ordering, UID mapping/order and their corresponding sparse-pack directory
records. All other Android payloads, including engine and artwork, are exact.
Web comparison validates all 392
resource paths: 390 payloads byte-identical, with only generated script-class
record ordering and UID mapping/order differences in the other two. Engine and
bootstrap payloads are unchanged. Calculated gzip changes are recorded separately
in evidence and are **not measured CDN transfer**. No startup improvement is
claimed for this infrastructure change.

## 16. What remains manual

Rights review and evidence retention; resolving the three SVG fixture ownership
records and broader font/UI/asset obligations; meaningful taxonomy/suitability
curation and factual metadata; approval of any external orientation/color prep;
Godot import and visual/device checks for new artwork; scaling performance and
package-size acceptance; store/platform signing/publication; and any future
old-content removal, availability or save migration policy. Private intake and
contracts must not be committed. The pipeline produces valid repository content,
not invented copyright permissions or a universal release-ready certificate.
