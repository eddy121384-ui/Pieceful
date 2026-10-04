# Pieceful Web performance and content-delivery audit

Audit date: 2026-10-04 UTC. Base: `hardening/release-readiness` at `2a0b75f928f5a702185289f6fa6ac84484d9944b`. Candidate branch: `perf/web-startup-content-delivery`. No merge, gameplay redesign, renderer change, geometry change, touch change, artwork resampling or save-schema migration.

**Keep the compatible packaging and bounded catalog-texture cache improvements.** They remove approximately 18 MB of redundant delivery and 49 MB of retained artwork textures in the measured multi-puzzle sequence. They do not establish mobile release readiness or solve the remaining startup initialization, Gallery thumbnail, photo-memory or WASM-engine costs. Read this audit alongside [RELEASE_READINESS_AUDIT.md](RELEASE_READINESS_AUDIT.md); its platform/account/device gates still apply.

The baseline and candidate shipping Web exports use locked Godot `4.7.2.stable.official.ed1daf0bf`. Timing uses actual shipping exports. Detailed gameplay counters use separately exported, non-shipping instrumentation of the accepted scene. Linux Chromium/SwiftShader is a repeatable comparison environment, not an iPhone, Android GPU or Poki certification. No production CDN, Safari device, permanent signing credentials, macOS or Xcode was available. The cloud network blocks the public Pages domain and GitHub API; no new hosted preview is claimed.

## 1. Current size breakdown

All numbers below are **bytes**. MiB means bytes / 1,048,576. “Calculated gzip” is Python gzip with `mtime=0`, over the actual file bytes. It is not measured CDN delivery. The Web total includes the nine `index.*` runtime files, excluding build reports and editor import sidecars.

| Artifact | Accepted baseline raw | Candidate raw | Baseline calculated gzip | Profiled candidate calculated gzip |
|---|---:|---:|---:|---:|
| Web total | 73,667,553 | 55,667,593 | 40,615,016 | 22,680,914 |
| WASM | 39,514,754 | 39,514,754 | 10,054,758 | 10,054,758 |
| PCK | 33,816,360 | 15,816,400 | 30,448,568 | 12,514,465 |
| Other loader/UI files | 336,439 | 336,439 | 111,690 | 111,691 |

The PCK falls from 32.25 to 15.08 MiB, a **53.2%** reduction. Total raw Web delivery falls 24.4%; calculated gzip falls 44.2%. WASM is unchanged at 37.68 MiB raw / 9.59 MiB gzip. The HTML difference is only Godot's validated PCK `fileSizes` value; the other engine/loader files are identical. This audit's fresh baseline differs slightly from the earlier release audit's rounded and previously generated artifact measurements.

**Final reimport variant:** after regenerated UID sidecars/class-cache ordering, raw sizes remain exactly the same, while whole-Web calculated gzip is **22,680,789** and PCK calculated gzip is **12,514,340** (125 bytes below the profiled artifact). Timing/HTTP measurements refer to the frozen profiled candidate, not a retimed final variant. [final-web-manifest.json](web-performance-evidence/final-web-manifest.json) records final hashes/sizes; [final-metadata-comparison.json](web-performance-evidence/final-metadata-comparison.json) verifies the only nine changed payloads are generated metadata. No display/code/identity/geometry payload changed.

### Ranked installed PCK inventory

The inventories parse the real PCK directory, hash every installed payload, and map Godot imports/remaps back to their source files. [before-inventory.json](web-performance-evidence/before-inventory.json) and [after-inventory.json](web-performance-evidence/after-inventory.json) contain the full ranked payload list and per-payload calculated gzip values. Those individual gzip values are not additive estimates of whole-PCK transfer.

| Rank by baseline bytes | Category | Baseline payload bytes | Candidate payload bytes | Interpretation |
|---:|---|---:|---:|---|
| 1 | 38 duplicate raw catalog identity/source files | 18,001,940 | 0 | Authoring JPEG/SVG bytes were deliberately shipped in addition to their imported display resources. Replaced by exact precomputed hashes. |
| 2 | 38 imported full catalog artworks | 9,856,250 | 9,856,250 | Every accepted display resource retained, byte-identical. |
| 3 | Five cut-pattern/schema files | 4,241,512 | 4,241,512 | Geometry preserved. Classic 286: 2,582,371; 150: 1,324,509; 40: 325,343; 12: 7,432; schema: 1,857. |
| 4 | Scripts/scenes/remaps | 636,921 | 637,574 | 207 → 209 payloads; shared identity helper added, three callers changed. |
| 5 | 35 imported museum thumbnails | 495,012 | 495,012 | Dedicated derivatives already existed; no full-artwork quality reduction. |
| 6 | Eight license/notice payloads | 187,356 | 187,356 | Attribution and engine/font notices retained. |
| 7 | Catalog/other resources | 149,763 | 154,269 | Includes the new 4,506-byte immutable identity manifest. |
| 8 | Three font resources | 143,679 | 143,679 | Regular/italic album OTFs and embedded catalog-ink fallback font retained. |
| 9 | Godot metadata/import overhead | 40,049 | 40,102 | Includes import/remap/UID metadata; not full imported-image size. |
| 10 | UI assets | 19,390 | 19,390 | Accepted icons/UI unchanged. |
| 11 | EdgeRelief shader | 3,423 | 3,423 | Byte-identical; no renderer modification. |
| — | PCK directory/alignment/padding | 41,065 | 37,833 | Container overhead, outside payload sums. |
| — | QA/development roots | 0 | 0 | Tests/tools/docs/authoring/browser bridge do not ship. |

Baseline has 427 entries; candidate has 392. There are no byte-identical duplicate payload groups. The avoidable duplication was **semantic**: original compressed artwork bytes plus Godot's imported display representation. The unchanged imported images are the resources Godot actually renders.

### Which resources are required, and when

The current Web loader downloads the entire PCK before starting the application. Consequently later-use resources still contribute to initial transfer, even when they are not decoded on the first screen.

| Stage | Actual requirement / loading behavior |
|---|---|
| A. Loader | HTML, JavaScript engine glue, WASM and the complete PCK; splash/icon as requested. No remote artwork fetch exists. |
| B. First Gallery | Main scene/inherited scripts, fonts, watercolor UI/icons, catalog metadata, local Gallery/save/history bootstrap, all Gallery card thumbnails. The inherited startup also creates a provisional 40-piece Garden puzzle, so Garden texture, cut data and accepted piece visuals exist before Gallery is usable. |
| C. Puzzle setup | Selected content metadata, image-aware dimensions/layout resolution, full artwork for preview, exact original-byte identity, save-slot compatibility checks. Full selected artwork is decoded here rather than every museum image at Gallery startup. |
| D. First gameplay | Selected full texture; relevant cut/layout data; accepted ContactShadow/Thickness/Face/EdgeRelief piece nodes and UI; saves/journal services. Pieces share the artwork texture and shader material. |
| E. Later Gallery | Current implementation constructs the card wall eagerly. All 35 museum thumbnails coexist; three demo fixtures use their existing resources. Full artwork loads when selected and is now bounded in the board cache. |
| F. Photo puzzles | User-supplied JPEG/PNG decode, orientation/canonical processing, local canonical PNG, hash of those actual bytes, runtime ImageTexture and generated layout. No catalog-manifest substitution and no upload introduced. Photo cards still retain full runtime textures. |
| G. Completion/replay/history | Current artwork, completion/share capture resources, journal/trace/save data and replay piece visuals. A history list itself does not require decoding every completed full artwork; replay/share of a selected record requires its artwork. |

Evidence includes `scripts/main.gd::_ready`, `startup_gated_gallery_main.gd`, `gallery_image_aware_main.gd::_add_content_card`, puzzle selection preview loading, and the before/after resource counters. No exclusive CPU attribution to each inherited `_ready` step was captured.

## 2. Startup timeline

`tests/web_performance_probe.mjs` instruments navigation, ResourceTiming, `WebAssembly.instantiateStreaming` and the existing production runtime-ready marker. Three trials per build/profile use fresh HTTP/IndexedDB browser contexts with cache disabled, viewport 390×844, DPR 1. The browser process is reused across cold-download trials: this is not proof of a cold OS/compiler cache. The HTTP server precompresses before listening, outside navigation timing. Browser/performance suites run sequentially.

| Shipping production milestone, median | Baseline | Candidate |
|---|---:|---:|
| Raw loopback runtime-ready | 5,612.1 ms | 5,785.1 ms |
| Gzip, emulated 20 Mbps / 40 ms: HTML DOM ready | 174.7 ms | 188.0 ms |
| Same profile: WASM response end | 8,442.1 ms | 8,417.4 ms |
| Same profile: streaming instantiate end | 8,512.4 ms | 8,465.0 ms |
| Same profile: PCK response end | 16,748.3 ms | 9,430.3 ms |
| Same profile: post-assets/instantiate to runtime-ready | 5,136.7 ms | 5,068.1 ms |
| Same profile: runtime-ready | **21,887.4 ms** | **14,498.4 ms** |
| Same profile: measured encoded response-body bytes | 40,606,170 | 22,672,067 |
| Same profile: measured decoded response-body bytes | 73,645,338 | 55,645,378 |

The 33.8% improvement on the throttled local profile is primarily less PCK transfer. Download/compilation overlap; the streaming instantiate interval is not exclusive compilation time. Approximately five seconds of engine/project initialization remain after assets. Raw loopback's candidate median is 3.1% slower; ranges overlap (baseline 5,573.1–5,760.5 ms; candidate 5,422.1–6,931.3 ms). **There is no supported CPU-startup speedup claim.**

The measured response-body totals differ from summing all nine files because only requested resources count, the directory HTML response is uncompressed, and browser icons/sidecars are not all downloaded. These are actual local HTTP body measurements, excluding a claim about TLS/wire overhead or CDN behavior. The repository does not configure production `Content-Encoding`; calculated compression is a hosting opportunity, not an existing delivery guarantee.

The existing production marker runs after main initialization. It is a useful stable milestone, **not an exact first-paint or Gallery-interactivity timestamp**. Screenshots at ready + 250 ms show Gallery, but do not establish when its first pixels appeared. The separate non-shipping QA fixture adds a frame marker when Gallery is visible, save bootstrap has completed and the startup curtain is no longer visible:

| Instrumented QA, raw loopback, one observation each | Baseline | Candidate |
|---|---:|---:|
| Gallery usable frame marker | 8,748.7 ms | 7,644.3 ms |
| Gallery state observed by harness | 8,956.9 ms | 7,850.2 ms |
| First Garden Start click → playable state observed | 1,118.0 ms | 1,120.9 ms |
| Scripted navigation → first playable state | 13,844.4 ms | 12,670.5 ms |

The last row includes a deliberate 2.5-second Gallery counter-sampling pause, UI automation/polling and fixture overhead. It is not a production end-to-end first-puzzle SLA. No exact production first-visible-screen, usable-Gallery or first-playable median was measured. See [summary.json](web-performance-evidence/summary.json) and the full raw browser records for timestamps, ranges and methodology.

## 3. Runtime and memory findings

### Piece-count fixtures

The same Garden fixture is sampled at 40, 150 and 286 pieces. The values below are maximum **sampled scoped counters**, not continuous whole-process peaks. GPU render-buffer and texture counters, WASM linear memory, JavaScript backing storage and process RSS have different ownership/accounting; **do not sum them into physical memory**.

| Fixture | Nodes | Draw calls | Texture bytes, both | Render-buffer bytes, both | WASM linear high-water, both |
|---|---:|---:|---:|---:|---:|
| 40 | 1,065 | 183 | 33,654,407 | 55,736,296 | 69,730,304 |
| 150 | 1,730 | 623 | 33,654,407 | 69,672,884 | 83,689,472 |
| 286 | 2,551 | 1,170 | 33,654,407 | 87,207,736 | 100,466,688 |

Godot process-time medians in this software-rendered probe are 20.35 → 22.05 ms (40), 26.5 → 31.0 ms (150), and 39.5 → 37.8 ms (286). FPS fluctuates heavily under SwiftShader. These measurements do not isolate CPU from GPU/presentation, and support no hardware frame-rate improvement claim. The accepted depth benchmark confirms three Polygon2D nodes and one relief Line2D per piece, one shared artwork texture/material, and no per-piece viewport/mesh. Geometry and imported renderer resources compare byte-identical.

**286 is not the catalog's universal maximum.** Querying all 38 current built-in layouts finds several Hard layouts with 300 pieces, including `met_359362`; other image-aware counts differ. A fresh-context 300-piece probe observes 2,625 nodes, 1,226 draw calls, 43,218,825 texture bytes and 89,059,468 render-buffer bytes in both builds. Its initial WASM high-water differs (83,689,472 baseline versus 100,466,688 candidate). Two additional alternating controls reverse that difference: baseline reaches 100,466,688 twice; candidate stays at 83,689,472 twice. Both builds therefore span the same sampled high-water range across three runs. [maximum-repeats.json](web-performance-evidence/maximum-repeats.json) preserves those results. This supports neither a stable regression nor a lower WASM peak claim. Arbitrary imported photo aspect ratios are not certified by a single catalog-maximum fixture.

### Multi-puzzle retention and lifecycle

Eight distinct museum selections followed by Gallery leave **94,382,248 → 45,462,175 texture bytes**: 48,920,073 fewer retained bytes. The old board cache held nine built-in full textures (Garden plus eight artworks); the candidate holds one. Actual piece/reference/preview nodes keep their own live references through the handoff. A focused WeakRef test proves the board cache stops owning obsolete textures; photo cache ownership remains unchanged. Selecting an evicted artwork later may decode/load it again. This is an explicit bounded-memory tradeoff, not a claim that every revisit is faster.

JavaScript `backingStorageSize` falls from 34,940,807 to 16,931,929 bytes at 40 pieces, and from 42,172,500 to 24,168,834 after eight artwork switches. This is consistent with removing raw PCK data from browser-side retained backing storage, separate from the unchanged WASM allocation steps. Ordinary JS heap and per-process RSS snapshots are recorded, but browser/GPU/spare renderer RSS can overlap shared memory and cannot supply a phone physical-memory budget.

Twelve Rail↔Scatter toggles create bounded Rail UI nodes (+55 in the browser fixture, +70 in the native probe). Subsequent puzzle/Gallery cycles rebuild/reuse that UI rather than growing per toggle. Eight artwork switches, repeated Gallery/game/Gallery cycles, completion, replay and photo switching were exercised. Completion/replay reaches 120,586,240 WASM bytes in both sequences; WASM high-water does not shrink even after live textures release. Completion texture usage drops 108,198,683 → 45,195,590 bytes after the prior artwork sequence. This is retained-cache relief, not a reduction to all allocation peaks.

The release engine's orphan-node monitor is unavailable: `get_orphan_node_count` returns zero outside `DEBUG_ENABLED` in pinned Godot source. Web zero is **not** evidence of no orphan nodes. The debug/headless native probe reports one existing `GalleryGrid` detached from the tree throughout both builds and still present after Main teardown. Node count returns to the root, but the detached grid produces teardown leak warnings. It is a pre-existing ownership issue, does not grow in this cycle test, and was not fixed here. Native headless static high-water at 286 is approximately 158.54 → 158.56 MB, essentially unchanged; this is not GPU/device memory evidence.

### Imported photos

The accepted 96×144 photo fixture keeps the same canonical PNG hash and save identity. A separate fresh-context sequence imports two approximately 3 MP existing catalog JPEGs as user photos (1,684×1,800 and 1,650×1,800) through the actual photo pipeline. Both builds show 45,778,409 texture bytes after one, 57,657,095 after two/Gallery, and 66,914,771 after returning to another built-in puzzle. WASM reaches 100,466,688 bytes. **This optimization does not reduce photo-texture retention.**

Photo Gallery cards and the photo cache retain full runtime textures; there are no dedicated photo thumbnail derivatives. `MAX_LONG_EDGE=4096` is applied after the entire original JPEG/PNG decodes. Very large camera photos can therefore peak well above the final resized texture's allocation. No input-size limit, decode-quality change, photo eviction or new persistence contract was introduced. These need their own hardware/memory/product validation.

## 4. Largest avoidable costs

1. **18,001,940 bytes of redundant raw artwork**: measured and removed, while every exact original-byte digest and imported image remains available.
2. **Unbounded full catalog texture ownership**: measured and bounded; approximately 49 MB of retained texture savings after eight distinct artworks.
3. **37.68 MiB stock WASM engine**: still the largest raw file. A custom trimmed Godot build is future work with an export/renderer/plugin compatibility burden.
4. **Eager Gallery thumbnail decoding**: 35 dedicated museum thumbnails total 495 KB packaged but approximately 18,656,400 RGBA bytes by source dimensions. All cards load them eagerly. Full museum artworks would total approximately 325,484,272 RGBA bytes if simultaneously decoded; the Gallery already avoids that with thumbnails. These dimension calculations are not observed GPU allocation totals.
5. **Provisional puzzle + inherited startup initialization**: approximately five seconds remain post-download on this software browser. Deferring that work could affect bindings, curtain/resume ordering and accepted startup behavior; no blind sequencing rewrite was made.
6. **Photo decode/card retention and replay high-water**: measured limitations remain. No renderer allocation redesign is justified by this audit.

No QA debris, duplicate fonts or unused high-cost UI resources were found in the installed package. Cut files are material at 4.24 MB raw, but represent accepted geometry; compression/storage changes need a separate compatibility experiment.

## 5. Changes implemented

- `addons/catalog_source_export/catalog_source_export.gd` now hashes all 38 original authoring files at export and emits the virtual `res://content/catalog_identity_v1.json`. It no longer ships complete duplicate raw images. Originals remain in the repository. The manifest is regenerated deterministically on every export, not hand-maintained.
- `scripts/catalog_content_identity.gd` centralizes the hash lookup: editor/source execution and `user://` photos hash actual local bytes; exported `res://` catalog identity uses the immutable manifest. Invalid/missing entries fail closed instead of inventing hashes. Three existing identity/texture callers use it.
- `puzzle_catalog_chaos_order_stress_puzzle_board.gd` and its Gallery subclass retain only the current built-in full texture in the board cache, while leaving user-photo entries and live rendering references intact.
- Web/Android inspectors verify every manifest digest against original repository bytes, every imported display remap/target, absence of raw duplicates, and all existing release boundaries/notices. Focused tests reject incorrect hashes, missing imported art and raw duplicate packaging.
- The generated stock Android Gradle directory gets `.gdignore` before extraction. Without it, a later Godot import can recurse into copied Gradle asset resources and encounter duplicate UID inputs. No tracked Android/native gameplay code changes.
- Non-shipping QA adds timing/memory/hash/lifecycle requests and explicit release-counter availability. The transition harness waits for usable Gallery and puzzle setup; its diagnostic drop point uses the visible rail canvas region. This changes fixture geometry/readiness only, not product inputs or touch rules.
- CI runs the new packaging and texture-lifecycle checks and triggers on this branch. Performance tools provide a local gzip server, PCK inventory, browser/native probes, summaries, exact content comparisons and old-export save-upgrade validation. No vendor/CDN dependency is added.

The complete file list is in [test-results.json](web-performance-evidence/test-results.json). No accepted renderer, shader, puzzle cuts, artwork imports, gameplay/touch, transition timing, save format, package ID or platform preset was modified.

## 6. Before/after validation and artifact findings

All shared artwork, thumbnails, fonts, UI, shaders, cut patterns and catalog metadata are byte-identical. PCK comparison permits only three changed compiled callers and UID metadata, the new identity helper/remap/manifest, and removal of exactly the 38 redundant original source paths. [content-comparison.json](web-performance-evidence/content-comparison.json) records the exact path lists. Two same-input candidate Web exports have identical 392 payloads, identical container bytes, unchanged non-pack files and idempotent loader instrumentation. This is local same-input reproducibility, not a cross-host/hermetic-build certification; most pre-existing source UIDs are generated locally rather than committed.

A subsequent cleanup/reimport comparison correctly **failed** the strict byte comparison. Inspection found exactly seven `.import` UID lines, UID-cache numeric mappings and global-class-cache ordering changed. The class records, unique UID resource paths, import targets/settings and all 383 other payloads remain exact. `compare_generated_metadata.py` validates those narrow differences rather than ignoring arbitrary metadata. The final runtime-ready check passes. Regeneration of uncommitted sidecars is an existing build-input limitation; this audit does not disguise it as deterministic byte packaging.

A further final repeat also fails the strict byte check, this time only class/UID-cache ordering differs; the other 390 payloads remain exact. Its calculated Web/PCK gzip values are 22,680,597 / 12,514,148, with identical raw sizes. The first final variant above is the artifact used for the final runtime-ready check. Both failures are reported, and the existing strict CI comparison is retained: a metadata-only CI failure must be inspected, not advertised as a passed byte-reproducibility check. Stable generated metadata across clean inputs remains follow-up build engineering work.

| Unsigned Android base-game artifact | Baseline bytes | Candidate bytes |
|---|---:|---:|
| APK | 57,050,728 | 39,047,892 |
| AAB | 56,981,399 | 39,036,955 |

Android builds/inspection pass exact identity/imported-art checks, notices, arm64 ELF 16 KB alignment, APK ZIP alignment, bundletool validation and effective non-debuggable manifests. Existing IDs, SDK 24/36, orientation and permissions remain unchanged. These are **unsigned base exports** without optional ads/billing SDKs, not installed/signed or Play-certified applications. The existing AGP warning about the newer compile SDK remains; no warning suppression or speculative toolchain upgrade was added. No iOS artifact/device validation is claimed.

### Tests run

| Check | Result / scope |
|---|---|
| Accepted native regression runner | **36/36 passed**, including save/resume/content identity, photos, Gallery, puzzle switching, Rail, touch, renderer/z-order, completion/history/replay/share, production provider guard. Individual names/times preserved in native-regressions.json. |
| Release Python / content ingestion | **7/7 release tests**, content ingestion and repository configuration validation passed. |
| New catalog packaging | **4/4 passed**; original hashes, missing display resource, changed hash and raw duplication coverage. |
| New texture ownership | Passed WeakRef release across eight artworks; photo cache preserved. |
| Existing depth benchmark | Passed 40/150/286, shared texture/material and accepted node structure. |
| Production Web export / inspection / repeat | Passed; 392 shipping entries, notices and no QA roots; exact display/content comparison and same-input reproducibility passed. |
| Production browser | Runtime-ready plus **four production/failure cases** passed: portrait/landscape and persisted online reload, no QA/private stdout, unavailable IndexedDB warning, missing PCK failure. Existing runtime continues after disconnect; offline reload still fails because no offline shell/cache exists. |
| Accepted commercial Web journey | **38 assertions, 54 screenshots**, no browser runtime errors: Gallery, real drag/snapping/trays, Board Lines on/off, portrait/landscape, photos, save/reload, completion/share PNG, replay and history. |
| Rail/Scatter runtime | Final full rerun **32 animated transitions** passed at 40/286, portrait/short landscape, singles/joined clusters/stored clusters/repeated toggles, plus real post-transition dragging. |
| Old-export → new-export save upgrade | Passed all 38 runtime digests; old museum and photo slots with progress; exact identity/geometry/discrete piece state; completed history unchanged. |
| Runtime diagnostic probes | Browser 40/150/286/300, eight artworks/cycles, repeated transitions, photos/completion/replay; native debug lifecycle/orphan probe and all-catalog layout inventory completed. |
| Android | Release unsigned APK/AAB export and inspection passed; no physical-device run. |

Two early transition-suite attempts failed on input setup: one lacked the Start control after a selection, another moved a joined cluster into the Rail area without storing it. Those failures are preserved in the evidence summary. Strengthening the fixture's usable-Gallery/setup waits and inspecting visible rail coordinates yielded a passing focused candidate control, a passing accepted-baseline control, and the full candidate rerun. The original drop point was already inside the canvas, so its failure is **not proven** to be an outside-canvas bug; the small diagnostic-coordinate adjustment does not establish a product fix. Product touch/rail code is unchanged, and intermittent browser input/device coverage remains a testing limitation.

The save-upgrade check initially compared floating-point normalized positions too strictly. A same-old-build reload control demonstrates pre-existing float32 normalize/denormalize drift (max 9.192e-8); new-build museum/photo drift is 8.477e-8 / 1.379e-7. Geometry and all discrete fields must match exactly; normalized positions must remain within 1e-6. IndexedDB timestamps ensure the test reads freshly committed saves rather than stale entries. This is numerical verification of the existing representation, not a migration or a changed save schema.

### Practical internal performance budgets

These are proposed **repository benchmark guardrails**, not Poki acceptance thresholds. No authoritative Poki size/timing threshold was available. Physical-device first paint and total resident peak remain unmeasured.

| Metric | CURRENT accepted baseline | ACHIEVABLE NOW / candidate guardrail | FUTURE ARCHITECTURE |
|---|---|---|---|
| Initial Web package | 73,667,553 raw / 40,615,016 calculated gzip | 55,667,593 raw / 22,680,914 calculated gzip; guard ≤56 MB raw / ≤23 MB calculated gzip on pinned stock engine. Actual tested local initial body transfer: 22,672,067 bytes. | Thumbnails/identity + one artwork could approach ~14 MiB calculated gzip by inventory arithmetic; structural estimate only, requires delivery/cache decisions and a build. |
| First usable screen | Production ready proxy 21.89 s throttled; exact usable Gallery not measured in shipping build | Ready proxy ≤16 s in the specified 20 Mbps/40 ms software benchmark (observed 14.50 s). Instrumented raw-loopback Gallery ≤9 s (single observation 7.64 s); production interactivity/device gate still open. | Defer provisional puzzle/thumbnail decode after tracing bindings; set actual Safari/Poki p95 budget from target devices. |
| First puzzle playable | Instrumented Start→Garden 1.118 s; production cold end-to-end unmeasured | Start→Garden ≤1.5 s in the fixture (observed 1.121 s). No claim about human selection or compressed production end-to-end latency. | Trace first selected artwork load plus interaction; remote loading must include cache misses/failures before setting a target. |
| Peak memory, 40 fixture | Sampled WASM 69.73 MB; texture 33.65 MB; buffers 55.74 MB | Scoped guardrails separately: ≤80 MiB WASM, ≤48 MiB texture, ≤58 MiB buffers in this viewport/fixture. Values unchanged; physical-device peak unknown. | Lazy Gallery/photo thumbnails may lower live textures; hardware process budget must be measured. |
| Peak memory, 286 fixture | Sampled WASM 100.47 MB; texture 33.65 MB; buffers 87.21 MB | Separately ≤110 MiB WASM, ≤48 MiB texture, ≤95 MiB buffers. These are sampled fixture limits, not total resident memory or a universal catalog/photo cap. | Custom engine/allocator and bounded photo lifecycle only after measured compatibility/device work. |

Do not apply the 40/286 guards to other artwork sizes, DPR 3, camera photos or share/replay. Include the actual 300-piece catalog fixture in future budget gates. These proposed caps are documented, not a newly shipping runtime limiter.

## 7. Content-delivery architecture recommendation

**A. Keep everything bundled, with this identity/cache optimization, for the next release candidate.** The measured gain is substantial and needs no hosting, network-only content, altered catalog or save migration. All native/offline-loaded content remains present. Web keeps its existing limitation: an already loaded game can continue offline, but an offline page reload has no service-worker shell.

**B. Bundled thumbnails/catalog/immutable identity with lazy full artwork** is the strongest next architectural experiment if initial delivery still misses measured target-device budgets. The current imported full artwork is 9.86 MB raw and remains roughly that size under gzip; removing most of it from startup can help, but the approximately 10 MB gzip stock WASM and initialization remain. No remote infrastructure is assumed or added here.

Before B is implementable, Eddy must choose origin/hosting, cache/offline policy, integrity/versioning, timeout/failure UX and release operational ownership. A safe design would keep immutable source SHA identity and attribution bundled, use versioned integrity-checked imported resources/PCKs, download into an atomic validated cache, retain the existing logical resource paths, and distinguish temporarily unavailable artwork from invalid save content. Missing network art must never quarantine a valid old save. Native can continue shipping all packs; imported photos remain local. Resume, history/replay/share and old content revisions must remain resolvable offline once promised cached.

**C. A first bundled pack with optional downloaded packs** can support a native/offline policy more explicitly, but changes catalog availability and pack ownership. That requires product choices. Neither B nor C is deployed or presented as existing production infrastructure. **D. A custom minimal Godot engine** addresses WASM instead of content, but carries separate renderer/export/toolchain risks and is not a high-confidence small change.

## 8. Save and content-identity implications

Identity required the **SHA256 of original source bytes**, not possession of those bytes at runtime. The old export plugin retained them because Godot normally exports imported resources instead of raw originals. The candidate computes exactly the same hash at build time and packages that immutable mapping, while the original imported artwork/remap remains unchanged at the same `res://` path.

Unchanged contracts include `identity_version=1`, `source_kind`, `source_id`, `sha256`, `content_key=sha256:<digest>`, content-key-driven seeds/layout behavior, saved game IDs and slots, photo canonical hash, journal and completed history. Manifest version 1 describes packaging metadata; it is **not** a save identity/schema version bump. Editor tests and authoring continue detecting actual original-byte edits. User photos always hash their real canonical local bytes, never a catalog entry.

Export inspectors compare all 38 original-byte hashes with the source catalog, ensure each imported display resource is present, and reject any duplicate raw source. The production Web runtime hashes agree with the independently exported old build for all 38 entries. Old museum/photo progress resumes through replacing only the QA PCK at the same HTTP/IndexedDB origin. The old completion/history record survives. The source catalog and every imported display, cut-pattern and shader payload compare unchanged. No save migration is necessary.

A future artwork revision still changes the exact source digest and must follow the existing compatibility/content-retention policy. This optimization does not authorize replacing original-byte hashes with perceptual hashes, imported-resource hashes or mutable remote metadata. Build-time hash integrity is not a signature/DRM boundary; users can modify their own local artifacts as before.

## 9. Remaining Poki/browser performance work and reproducibility

Required next measurements: physical iPhone Safari and representative Android browsers, device DPR/orientation/thermal/memory pressure, continuous whole-process/peak allocation traces, first paint and real Gallery input acceptance, slow/bad networks, cached reload versus fresh boot, large camera imports, repeated share/replay, Poki iframe/storage partitioning and SDK lifecycle. Measure actual deployed `Content-Encoding`, cache headers and encoded transfer from the chosen host; gzip arithmetic does not guarantee delivery compression. Hosting/Poki integration and the release audit's legal/account/device requirements remain unresolved.

The source tooling is reusable. Use the onboarding startup instructions to activate pinned tools/proxy/CA paths. Do not use the system Godot 4.6.3 for these artifacts. Independent browser suites are sequential to avoid software GPU contention. Pinned stock templates and editor must match.

```sh
source /workspace/.pieceful-cloud/activate.sh
python3 tests/catalog_packaging_smoke.py
python3 tools/release/run_native_regressions.py --output build/perf-native-tests
"$GODOT_BIN" --headless --path . --script tests/catalog_texture_lifecycle_smoke.gd
python3 tools/release/export_web.py --output build/perf-after/index.html
python3 tools/performance/package_inventory.py build/perf-after/index.pck \
  --output /tmp/after-inventory.json
python3 tools/export_product_ux_qa.py --godot "$GODOT_BIN" \
  --output build/perf-after-qa/index.html
python3 tools/performance/serve.py --root build --port 4290
```

Run the server in a separate terminal. Export baseline into `build/perf-before` from the exact base commit using its original inspectors, and keep baseline files frozen. Export the respective non-shipping fixtures to `build/perf-before-qa` / `build/perf-after-qa`; baseline product code stays at the accepted commit, with only diagnostic fixture instrumentation added. The production export is not instrumented with QA gameplay requests. The performance script expects these directory names.

```sh
# Playwright 1.55 must be resolvable by the .mjs runner. In this cloud it is
# installed externally, so copy the script beside that node_modules directory.
cp tests/web_performance_probe.mjs /workspace/.pieceful-cloud/browser/perf.mjs
export PIECEFUL_CHROMIUM_EXECUTABLE=/usr/bin/chromium
export PIECEFUL_PERF_ORIGIN=http://127.0.0.1:4290
PIECEFUL_PERF_LABEL=before PIECEFUL_PERF_OUTPUT=/tmp/before-browser.json \
  node /workspace/.pieceful-cloud/browser/perf.mjs
PIECEFUL_PERF_LABEL=after PIECEFUL_PERF_OUTPUT=/tmp/after-browser.json \
  node /workspace/.pieceful-cloud/browser/perf.mjs
# PHOTO_ONLY and MAX_ONLY append separate fresh-context lifecycle/300-piece probes.
# Restart serve.py after changing exports: gzip is precomputed before listen.
```

Use `tools/performance/summarize.py`, `compare_content.py` and `tools/release/compare_web_exports.py` for summaries/comparisons. The old-save upgrade fixture requires both frozen QA exports and the same origin; see its environment variables at the top of the script. Android commands/toolchain remain those in the release audit and locked installer scripts. Runtime memory/layout probes require external output paths and isolated user/cache directories; do not pollute player saves.

Committed machine-readable evidence omits massive videos/artifact binaries, secrets, private user photos and generated caches. Screenshots use existing bundled content. Existing source metadata generation prevents claiming universal byte-identical exports across machines. Local same-input content comparisons passed; new-branch CI provides independent export validation rather than a fabricated hosted preview.

## 10. Future optimizations intentionally not implemented

No remote content/CDN, service worker/PWA, catalog removal, thumbnail quality reduction, texture import-quality change, renderer/shader rewrite, geometry serialization change, save-schema change, custom engine, monolithic startup-binding rewrite, photo decode limit/eviction or engagement/monetization system was introduced.

Priority follow-up experiments are: deployed compression/cache-header verification; actual device startup/whole-process memory traces; visible-row Gallery decoding with scrolling/focus regression coverage; photo thumbnail ownership and safe predecode limits; provisional puzzle deferral after binding/restore trace; orphan-grid teardown ownership; optional content packs only after hosting/offline decisions; and a trimmed Godot engine only with complete export/renderer validation. Each needs its own before/after measurement and compatibility proof.
