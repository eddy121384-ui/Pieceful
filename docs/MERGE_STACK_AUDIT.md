# Pieceful merge-stack audit

Observed 2026-10-06, Asia/Taipei. Original cumulative candidate:
`e3db06363a8dc26ba3194d9f66cd7942fa62c13b`.
No branch was merged, rebased, force-pushed or deleted during this audit.
`git merge-tree` results below are simulations that create unreferenced tree
objects, not branch merges or publication.

## 1. Executive verdict

**The four feature layers form a clean internal linear stack, but the original
top branch cannot land unchanged on current main.** Main advanced 24 commits
from the common fork. Its shared Pages publisher conflicts with the stack,
and catalog PR validation against pre-hardening main fails because main lacks
the hardening layer's asset inventory.

Both defects have narrow corrections on `integration/merge-stack-cleanup`,
based directly on the original top branch. Integration fix commit:
`22f156d64e973ebce9e76f3a5e350c40fb0f4155`. A measured browser-test state-read
race is corrected separately in `a2b1a00734796072a6ab8df67fe7b3577a7ccf60`,
without changing runtime code or weakening the drag assertion. The recommended
integration is **one
merge commit from this final cumulative cleanup branch into main**, preserving
the original 29 stack commits and main's independent preview history.
The audit/report commit on top contains documentation/evidence only; its final
SHA is reported at delivery.

The corrected simulated merge is conflict-free against the main SHA in the
table below and preserves all main-only preview files byte-for-byte.
Local cumulative validation passed after the corrections, with the initial
browser failure and existing warnings disclosed in section 7.
Integration acceptance remains conditional on review of
the actual GitHub PR merge result and green required CI. This is not public
release, signing, mobile-device, Poki or legal certification.

## 2. Exact branch lineage

| Branch | Observed remote HEAD | Merge-base with previous intended layer | Previous-only / branch-only commits |
| --- | --- | --- | ---: |
| `main` | `2d7784c55607bd33e40a8c82480fc6242913541a` | — | — |
| `spike/codex61-commercial-product-ux-pass` | `a66a851accb0b9198cff537263d69335816e4088` | `8f805080880e02f652a5d6954112616363402bf1` | 24 / 23 |
| `hardening/release-readiness` | `2a0b75f928f5a702185289f6fa6ac84484d9944b` | `a66a851accb0b9198cff537263d69335816e4088` | 0 / 3 |
| `perf/web-startup-content-delivery` | `4ea7eca8644dfb105eefe7b2d782b9dd664dd614` | `2a0b75f928f5a702185289f6fa6ac84484d9944b` | 0 / 2 |
| `tools/catalog-content-pipeline` | `e3db06363a8dc26ba3194d9f66cd7942fa62c13b` | `4ea7eca8644dfb105eefe7b2d782b9dd664dd614` | 0 / 1 |
| Integration correction | `22f156d64e973ebce9e76f3a5e350c40fb0f4155` | `e3db06363a8dc26ba3194d9f66cd7942fa62c13b` | 0 / 1 |
| Browser regression synchronization | `a2b1a00734796072a6ab8df67fe7b3577a7ccf60` | `22f156d64e973ebce9e76f3a5e350c40fb0f4155` | 0 / 1 before report |

The common fork is `8f805080880e02f652a5d6954112616363402bf1`.
Hardening, performance and catalog are strictly ahead of their intended parent;
no infrastructure layer diverged. UX is strictly ahead of the original fork,
but **not** ahead of current main. A fast-forward to the cumulative branch is
therefore impossible. Rebasing is unnecessary under the recommended merge
strategy; the original publisher requires conflict resolution unless the
prepared cleanup is included.

All 29 original stack commits have one parent and distinct stable patch IDs.
`git cherry main top` reports no patch-equivalent/cherry-picked commits.
Ancestry proves every original layer commit is present in the top branch;
there are no missing layer commits or duplicate layer merges. Main's 24 commits
are independent standalone chess/Shogi/Space Drift preview publication updates.
They alter only the shared publisher plus nine `web/previews/` files. None
changes accepted Pieceful gameplay, catalog artwork or save logic.

## 3. Layer contributions and diff inventory

Inventory uses the **common fork**, not current main, for layer A. Comparing
current main to UX also shows main-only preview files as absent on the old
branch; that is divergence, not a deletion by UX. A normal corrected merge
preserves those files.

| Layer | Commits / changed paths versus parent | Concrete contribution |
| --- | ---: | --- |
| A: UX | 23 / 134 | Album Desk and watercolor surfaces/icons, commercial Gallery/setup/continuation/navigation, named tray and confirmation flows, photo/history/completion/share/replay journey, saved-session hooks and solved-piece resume visibility, sage Board Lines presentation, shared cardboard visuals during Rail/Scatter ghosts, native/browser QA and isolated branch previews |
| B: hardening | 3 / 42 | Production export exclusions and notices/inventories, version/orientation/release stdout config, denied-browser-storage disclosure, release test-ad guard, checksum-locked build tools, Web startup/failure tests and full regression CI, inspected unsigned base Android APK/AAB/SDK/alignment evidence |
| C: performance | 2 / 52 | Original-byte runtime identity manifest without duplicate raw artwork, shared identity helper, bounded full-artwork cache preserving user-photo ownership, package/startup/memory profiling and old-export save upgrade instrumentation, Android generated-template import shielding |
| D: catalog | 1 / 31 | Existing-schema authoritative registry, immutable source/legacy derivative locks, offline PNG/JPEG intake, rights/provenance gates, deterministic thumbnails/projections, dry run/idempotency, journaled transaction/recovery, build mutex, offline CI and isolated playable sample |

Recorded source diffs contain no deleted or renamed tracked paths in the
original stack. All current artwork/cut-pattern bytes remain unchanged by the
cleanup; UI/renderer source equality is checked independently from tests.
Physical iPhone/Android testing was not performed in this audit. User acceptance
and the reported iPhone defects inform scope; recorded automated evidence is
native headless and actual Chromium with mobile emulation, not physical Safari.

## 4. Every overlapping file

These are all 18 paths changed by more than one original layer. The cumulative
diff and final behavior were inspected; the cleanup does not replace any with
an earlier version.

| Path | Layers | Cumulative behavior verified |
| --- | --- | --- |
| `.github/workflows/release-readiness.yml` | B/C/D | Locked tools, accepted native/production/QA separation and Android checks remain; C adds package/cache tests, D adds dependencies/catalog validation/sample; cleanup limits push to main while retaining PR/manual validation |
| `.gitignore` | B/D | Build/cache/signing protection plus ignored operator intake; markers/README remain tracked |
| `addons/catalog_source_export/catalog_source_export.gd` | A/C/D | A's editor plugin remains enabled; C substitutes exact original SHA mapping for raw duplicate files; D checks the generated mapping against real source bytes before adding the same virtual runtime manifest |
| `export_presets.cfg` | A/B | Accepted Web rendering/export choice retained; B adds production exclusions/notices and Android release config; all three presets share the tightened boundary |
| `project.godot` | A/B | Watercolor colors, accepted main scene and enabled export plugin retained; only version, orientation and release stdout settings added by B |
| `scripts/commercial_product_ux_main.gd` | A/B | Accepted startup/session/navigation intact; B adds a browser-storage-loss disclosure after Gallery readiness |
| `tests/catalog_export_upgrade_browser_smoke.mjs` | C/D | C's old-original-byte save/identity/history comparison retained; D makes the target QA pack configurable without weakening assertions |
| `tests/catalog_packaging_smoke.py` | C/D | No raw duplicates and exact original hashes/imports checked; D derives entry count from catalog instead of hardcoding 38 |
| `tests/commercial_product_browser_fixture.gd` | A/B/C | Accepted real-control fixture plus explicit QA-only provider/release diagnostics and performance/hash probes; never shipped |
| `tests/rail_scatter_transition_browser_smoke.mjs` | A/C | Shared cardboard ghost/handoff/joined cluster/z-order/interaction checks retained; C's exact piece/orientation filters retain the full default matrix; cleanup waits for actual published drop completion, without another input or retry |
| `tests/web_runtime_ready_smoke.mjs` | A/B | Actual runtime-ready/canvas check retained and release/configuration diagnostic handling improved |
| `tools/export_product_ux_qa.py` | A/B | Separate QA main scene and temporary QA export inclusion; production project/presets restored in `finally` |
| `tools/instrument_web_loader.py` | A/B | Existing loader instrumentation retained; browser persistence reconciliation patch is idempotent |
| `tools/release/check_repository.py` | B/D | Release/config/notices/source hashes retained; D validates pipeline and treats legacy museum manifest as frozen subset, not a second hand-maintained catalog |
| `tools/release/export_android_validation.py` | B/C/D | Unsigned base release APK/AAB, preset restoration, C's `.gdignore` for generated template tree, D's full-export catalog mutex/validation |
| `tools/release/export_web.py` | B/D | Production export/inspection and truthful artifact stamps retained; D validates and holds catalog lock during export |
| `tools/release/inspect_android.py` | B/C | SDK/package/permissions/non-debug/notices/alignment retained; C verifies compact exact-original-byte identity instead of demanding raw duplicate art |
| `tools/release/inspect_pack.py` | B/C/D | Production dev/QA boundaries retained, C validates compact identities, D excludes intake |

Independent checks confirm 296 protected tracked resource/source files on the
cleanup branch are byte-identical to the original top branch, including all
scripts, artwork, cut patterns, content/identity/asset records, notices,
`main.tscn`, `project.godot` and `export_presets.cfg`. No Board Lines, cardboard
factory/EdgeRelief, transition timing/positions, touch/pinch or save code was
changed by integration work.

## 5. Generated and authoritative file integrity

The accompanying machine inventory classifies each relevant tracked path:
201 KEEP TRACKED and 153 EVIDENCE / DOCUMENTATION ONLY paths, including this
report/evidence. CI-only outputs are described below and have no tracked paths.
No tracked local build/cache/transaction/private-intake outputs or documentation
image import sidecars were found. Existing identifiers/import settings are
preserved rather than deleted for cleanliness.

| Class | Artifacts and reason |
| --- | --- |
| KEEP TRACKED | Approved original artwork and legacy thumbs; `.import` settings and `.gd.uid`/shader identifiers; authoritative authoring registry and immutable identity locks; generated runtime `content/catalog_v1.json`, authoring hash/asset projections and `licenses/ASSET_MANIFEST.json`; frozen `content/runtime/met_v0_manifest.json`; taxonomy/provider inputs, offline historical curator/provenance inputs; complete engine/font/native notices and inventories |
| GENERATE IN CI ONLY | Virtual `res://content/catalog_identity_v1.json`, PCK/WASM/APK/AAB, export/import caches, loader build-info/artifact reports, transient QA projects and ordinary pipeline run reports under `build/` |
| EVIDENCE / DOCUMENTATION ONLY | `docs/ux-evidence`, `release-readiness-evidence`, `web-performance-evidence`, `catalog-pipeline-evidence` and this merge audit evidence; guides; independent `web/` previews/content lab, excluded from Godot exports |
| SHOULD NOT BE TRACKED | Private intake/contract files, journal/backups, keystores/tokens, local SDK/templates/generated `android/build`, raw test/export output and build-specific import sidecars; none found in the candidate tracked inventory |

Regeneration is zero-diff. All 38 IDs/source IDs/source SHA256s and existing
derivatives are unchanged; export inspections verify every original hash and
imported artwork with zero duplicate raw catalog sources. The legacy 35-entry
museum asset manifest remains a frozen provenance snapshot, not live catalog
authority. Registry generation owns current catalog/inventory/identity outputs.
Virtual export identity is generated from original bytes and is not hand-edited.

Three original SVG fixtures retain explicit `UNKNOWN/REVIEW_REQUIRED` rights.
Ordinary integrity validation warns; `--production-rights` intentionally fails
with those three IDs. New unknown/rejected content cannot be promoted. This
historical exception is not artwork ownership or public release clearance.

The initial PR-baseline failure is reproducible at the original top:
`validate --baseline-ref origin/main` cannot read the missing old asset inventory.
The correction only falls back when Git confirms that inventory is absent.
It hashes **that commit's actual original artwork blobs**, still protects all
old IDs/source IDs/paths/hashes and still fails for missing original sources or
changed bytes. Existing inventory/immutable-lock behavior is retained.

## 6. Workflow and CI findings

All 15 workflows were inspected; 8 are touched by the original stack.
Their triggers, permissions and jobs are inventoried in the accompanying JSON.

The authoritative post-integration validators are `release-readiness.yml` and
`catalog-content-pipeline.yml`: push on main, PR validation and manual dispatch.
The dedicated catalog job intentionally overlaps whole-catalog validation with
the export job but additionally exercises transactional/deterministic ingestion
and the immutable Git base with full history. This is complementary coverage,
not duplicated release publication.

The shared `web-mobile-preview.yml` publisher is main-only after cleanup. It
retains accepted native/browser checks, uses checksum-locked install on cache
hits, installs pinned catalog dependencies and uses inspected/locked production
Web export. Its main-only job guard prevents a manual feature-ref dispatch
from replacing the public root. Current main's chess/Shogi/Space Drift copy
steps are preserved verbatim, including the LAB manifest. The dormant historical
feature-sync block is retained to make the divergent publisher merge clean;
it is unreachable under the main-only job guard and can be removed in a
separate post-integration cleanup. No preview was deployed by this audit.

| Workflow group | Current findings / post-integration role |
| --- | --- |
| `release-readiness`, `catalog-content-pipeline` | Pinned checkout/actions/Godot/dependencies; PR/main/manual validation, base unsigned Android; no production signing secrets. Required-check enforcement needs repository-owner settings. Artifacts retained 7/14 days, not permanent evidence. |
| `web-mobile-preview` | Main publisher conflict prepared without merging; strengthened cache/archive checks and full catalog/export validation. Preview checks are not certification that all independent required CI jobs already passed; gate the PR before merging. |
| `commercial-product-ux-preview`, `watercolor-ui-preview`, `watercolor-ui-system-preview` | Historical feature publishers with branch-specific triggers and manual dispatch, sharing Pages concurrency. Restore a latest successful Pages artifact via Actions API; expired artifacts can block restoration. Retire/disable after integration, preserve historical evidence. Do not widen their triggers to main. Older watercolor installers do not verify cache integrity like authoritative release tooling. |
| `android-monetization-sandbox`, `android-play-internal` | Optional native SDK/manual signing pathways; locked Godot but separate from base-game validation. Old issue-branch triggers should retire after their ownership is reviewed. Ephemeral CI-signed artifacts are not Play signing readiness. Permanent signing is step-scoped and temporary keys removed; no signing operation was run here. |
| `puzzle-piece-depth-smoke` | Historical feature-branch standalone coverage, superseded by cumulative native regressions; retire automatic old triggers after checking external branch ownership. |
| `content-ingestion-smoke` | Offline legacy tool self-tests; retain PR/manual test coverage, retire historical issue-branch push trigger when appropriate. |
| `ai-curator-cloud`, `catalog-promotion`, `puzzleability-v0`, `runtime-museum-assets-v0` | Historical acquisition/curation pipelines, some auto-commit with `[skip ci]`. They are not current shipping authority. Materializer is explicitly guarded from overwriting a managed catalog; freeze write workflows pending a separate operator decision. Do not let refreshed historical evidence bypass the registry/pipeline. Never use these as main production-content promotion. |
| `mobile-museum-preview` | Historical network materialization and committed preview output; superseded by inspected production export and current publisher. Retire after ownership review. |

CI uses repository installers rather than `.pieceful-cloud` paths. Local
activation, Chromium executable and proxy/CA/JDK selectors are environment-only;
they are not dependencies embedded in shipping runtime or CI. Current catalog
validation is offline once pinned packages are installed; no museum service is
required. Godot archives/Gradle/bundletool checks remain enabled. Hosted runner,
JDK/import UID ordering and SDK inputs are not a demonstrated cross-host hermetic
container build. Production artifacts and QA fixtures remain separate.

The older release audit now explicitly identifies its historical checkpoint;
its original approximately 70 MiB Web delivery/raw-source discussion must not
be read as current architecture. Performance/catalog evidence retains its
original parent-SHA/dirty-source provenance; it is historical evidence, not a
clean build certificate for a later commit.

## 7. Full cumulative validation

The 36-suite native runner used the original cumulative top SHA. Protected
runtime/content files stayed byte-identical through both cleanup commits;
the changed baseline test and browser synchronization were rerun separately.
Fresh Web/Android exports identify `22f156d` and `tracked_source_dirty=true`
(the historical-audit documentation note). This is truthful local provenance,
not a clean hosted build certificate for the final documentation commit.
The final Rail matrix uses the `a2b1a0` browser script and the same QA pack.

| Validation | Exact result / scope |
| --- | --- |
| Accepted native suites | **36/36 PASS**: catalog/content identity, Gallery/selection/navigation, photo ownership, save/resume/recovery, completion/history/share/replay, cardboard depth/EdgeRelief/z-order, Board Lines, Rail/Scatter, touch arbitration/pinch/zoom and release provider guards |
| Additional texture lifecycle | **1/1 PASS**, isolated user storage; bounded catalog ownership preserved |
| Catalog pipeline focused Python tests | Original **33/33 PASS**; corrected **34/34 PASS**, including actual old-Git-byte identity fallback and tamper rejection |
| Release / packaging Python tests | **7/7** release and **4/4** packaging PASS; legacy content-ingestion script PASS |
| Catalog validation / generation | Default and `--baseline-ref origin/main` PASS; dry generation **0 changed files**, unchanged 38 identities/derivatives |
| Strict production-rights gate | **Expected BLOCKED, exit 2**, exactly `garden`, `twilight_lake`, `crane_pine_scroll`; this is not a release-rights pass |
| Production Web export | PASS, **392 entries**, 38 original hashes/imports, 8 required notice files, **0 forbidden paths / 0 raw artwork duplicates** |
| Runtime-ready browser check | **1/1 PASS** on actual production engine/canvas |
| Production browser failure/storage checks | **4/4 PASS**: portrait/landscape/online reload/no QA bridge; live offline tab with unsupported cold reload; denied IndexedDB disclosure; missing-PCK visible startup failure |
| Commercial Web journey | **38/38 assertions PASS**, 54 screenshots, 0 browser errors; real Gallery/game controls, photo upload, save/continue, Board Lines ON/OFF, completion/history/share/replay and navigation |
| Rail/Scatter final Web matrix | **32/32 transitions PASS**: 8 each at 40/286 pieces × portrait 390×844/short landscape 844×390; single and joined/stored islands, repeated toggles, all shared cardboard layers, no legacy white outline, depth/z-order checks and post-transition real drag; 0 browser errors |
| Old export → current compact-identity upgrade | **1/1 PASS, 4 checks, 2 old saved slots**: same browser origin, all 38 original SHA256s identical without duplicate raw files; museum + photo identity/geometry/discrete state and completed history unchanged; normalized coordinate drift <1e-6, 0 browser errors |
| Isolated catalog sample | **1/1 PASS**: 39-entry isolated Gallery, generated sample selectable/playable, source quality/hash and thumbnail preserved; original shipping catalog remains 38 entries |
| Repeated production export / loader | **392/392 resource hashes PASS**, all non-PCK bytes and PCK container bytes identical in this local pair; loader instrumentation idempotent; repeat stamped `a2b1a0`, documentation dirty |
| Unsigned Android base release | **APK and AAB PASS**: bundletool, package/SDK/permissions/non-debuggable, 16 KB ELF, zip alignment, notices, original content hashes/imports, no raw duplicates; no install/signing/device claim |
| Workflow / prospective publisher | Three corrected YAML trigger/guard checks PASS; conflict-free simulated merge; **10 copy steps / 13 standalone preview files PASS** on the simulated tree, no deployment |

The initial unmodified full Rail run failed its joined-cluster drop assertion at
40 pieces in landscape after the test's fixed 700 ms delay. An isolated
unmodified rerun passed 8/8. The fixture publishes state every 200 ms on Godot
frames; browser mouse-up acknowledgement does not wait for Godot's next input
frame/state publication, especially under the software-rendered test load.
The snapshot already showed the cluster at the Rail location but was still
marked pickable. The narrow test-only correction waits at most 5 seconds for
the actual anchor to become non-pickable. It neither retries the drag nor
mutates game state. In the final 40-landscape run, `immediatePickable=true`
became false about **980 ms later with no additional input**, directly proving
the observed read race. The same real-drag assertion and all visual checks
remain. The final complete 32-transition matrix passed. The initial failure is
retained in evidence rather than counted as a first-attempt pass.

All 36 native suites exited successfully with their PASS markers, but emitted
**58 WARNING lines and 9 ERROR-labelled lines**. Three errors are intentional
corrupt-JSON recovery diagnostics. Six are existing teardown diagnostics in
the two watercolor suites: resources still in use, DummyTexture RID leaks
(9/11) and Font RID leaks (2 each). Those two suites' error lines match the
prior catalog-layer logs. CanvasItem/ObjectDB teardown warnings include 75/76
ObjectDB instances in those suites. These are recorded verbatim in evidence;
passing exit codes are not proof of zero leaks or physical-device stability.
The additional isolated sample also emitted 1 CanvasItem and 2 ObjectDB teardown
warnings; those two lines are separate from the 58 native-runner warning lines.
Exports also reported the existing missing project-icon fallback and ADB
connection refusal with no device attached. No gameplay source was changed to
silence diagnostics.

| Artifact, exact bytes | Original catalog-layer baseline | Fresh cleanup | Difference |
| --- | ---: | ---: | ---: |
| Raw Web bundle | 55,667,593 | 55,667,593 | 0 |
| Web PCK | 15,816,400 | 15,816,400 | 0 |
| Web WASM | 39,514,754 | 39,514,754 | 0 |
| Calculated deterministic gzip total | 22,681,965 | 22,681,745 | −220 |
| Unsigned Android APK | 39,047,912 | 39,047,932 | +20 |
| Unsigned Android AAB | 39,037,005 | 39,037,024 | +19 |

Gzip is calculated from local artifacts, **not measured CDN transfer**.
Of 392 packed Web entries, 390 payloads are byte-identical to the original
catalog export; only the validated Godot global-class cache ordering and UID
cache differ. Resource-ID mappings preserve all unique source paths. Android
differences are the same generated caches and corresponding sparse directory
metadata; every other decompressed payload is byte-identical. WASM/bootstrap
bytes are identical. Imported artwork occupies 9,856,250 bytes, cut patterns
4,241,512, scripts 637,574, thumbnails 495,012; the complete grouped inventory
is in evidence. No startup-speed improvement is claimed by this integration
cleanup and no content/texture optimization was reverted.

Committed [merge-stack-evidence](merge-stack-evidence/validation.json) contains
the exact suite names/results, initial/final browser outcomes, manifests,
comparisons, warnings and local provenance. Larger screenshots and complete
logs remain nonshipping local `build/merge-stack-audit` and environment logs.
Hosted GitHub CI and the future PR merge ref have **not** been run here.

## 8. Merge risks

1. Main can move again. Exact SHAs in this report are observations, not permanent
   locks; fetch and recheck the prospective merge before approval.
2. Original top has one publisher conflict and one failing older-baseline CI
   assumption. Include the prepared cleanup rather than choosing an entire
   old/main publisher blindly; either choice loses accepted cumulative intent.
3. GitHub required checks/branch protection, Pages permissions and hosted CI
   outcomes need account access. This environment cannot certify those settings
   or a GitHub PR merge ref that has not yet been created.
4. Generated identities/catalog/inventory/artwork must be reviewed together;
   never force-rewrite old artwork or infer clearance from a URL or inventory.
5. Keep historical preview publishers frozen during integration and retire them
   afterward so a manual restore cannot publish an older root artifact.
6. Existing headless teardown warnings, unsupported offline cold reload and
   unverified real-device behavior remain explicit limitations, not hidden passes.

## 9. Recommended strategy

**One normal merge commit from the cumulative integration cleanup branch.**
Review A/B/C/D as meaningful commit/diff boundaries, but land them together.
All original work is already present by ancestry; four intermediate merges
would add redundant merge commits, CI/deploy cycles and temporarily published
partial stacks. They would also put publisher resolution at an earlier layer.

Sequential merges (A) can preserve history, but add avoidable integration noise
and intermediate root deployments. Merging the original final branch alone
(B) needs the two corrections; its corrected cumulative child is recommended.
Squashing infrastructure (C) weakens ancestry/debugging and old generated-file
history and gives no conflict advantage. Rebasing/cherry-picking (D) would
rewrite accepted SHAs or duplicate work and is not justified.

One merge commit preserves both parent histories, all layer SHAs and main's
independent preview changes. Whole-stack rollback, if required after review,
is a revert of that merge with mainline parent 1, not a force reset. That is
rollback clarity, not authorization to perform a revert now.

## 10. Exact future integration sequence

These are **future owner/reviewer operations**, not actions taken in this audit:

1. Fetch main and `integration/merge-stack-cleanup`; confirm the four original
   layer SHAs match the table, the final cleanup SHA matches the delivered SHA
   and main still matches the observed main SHA. If not, repeat lineage/simulation.
2. Open **one PR** from `integration/merge-stack-cleanup` to `main`. Review the
   original layer diffs plus small cleanup, inspect the PR's combined merge
   result and require green release Web/native/browser, catalog and unsigned
   Android checks. Rerun checks on the GitHub merge ref rather than treating
   earlier branch evidence as that merge ref's result.
3. Use GitHub **Create a merge commit**, not squash or rebase. No UX/hardening/
   performance/catalog PR needs a second merge after its commits are included.
4. Revalidate the new main and its Pages artifact. Preserve independent preview
   paths and inspect the game production pack before treating integration as done.

Read-only preflight (run before the future PR merge):

```sh
git fetch origin main integration/merge-stack-cleanup
git merge-base --is-ancestor origin/tools/catalog-content-pipeline \
  origin/integration/merge-stack-cleanup
git merge-tree --write-tree origin/main origin/integration/merge-stack-cleanup
python3 tools/catalog_pipeline.py validate --baseline-ref origin/main
python3 tools/catalog_pipeline.py generate --dry-run
```

The actual sequence is current main plus one cumulative cleanup merge; it is
not `main -> UX -> hardening -> performance -> catalog` as four merges.
No merge/rebase/delete/publication was executed by this audit.

## 11. Post-merge cleanup and checkpoint

- After merged main/required CI/package/preview checks, the four listed feature
  branches and `integration/merge-stack-cleanup` are safe to delete **once their
  HEADs are confirmed ancestors of main**. Keep other people's preview/issue
  branches until their owners review them. No branch was deleted here.
- Disable/retire the three obsolete watercolor/commercial branch publishers;
  retain the main publisher and authoritative release/catalog validators.
  Main/PR triggers are already prepared; remove the unreachable historical
  feature-sync block after successful publisher verification.
- Freeze legacy acquisition write workflows. Retain useful offline self-tests
  and curator evidence; new production content must use approved local intake.
- `CATALOG_CONTENT_PIPELINE.md` is authoritative for content operation;
  `WEB_PERFORMANCE_CONTENT_AUDIT.md` records measured packaging/runtime changes;
  the historical release audit plus this audit describe outstanding platform
  gates. Keep all evidence folders as dated, nonshipping history.
- After clean main validation, create an annotated owner-approved integration
  checkpoint tag, for example `integration/catalog-pipeline-2026-10-06` at the
  verified merge commit. Do not label this an App Store/Play/Poki release.
- First command on updated main:
  `python3 tools/catalog_pipeline.py validate --baseline-ref HEAD^1`, followed
  by zero-diff regeneration and the authoritative release workflow.
- First production-facing task: resolve artwork/project/third-party legal and
  privacy/hosting/Poki scope gates, then physical Safari/Android and low-end
  browser acceptance using the verified main artifact. Do not start speculative
  monetization or redesign.

## 12. Remaining native/mobile/public release blockers

Integration readiness does not resolve the three fixture ownership records,
broader project/artwork/font/native dependency obligations, truthful privacy/
store declarations, account/required-check settings or official host/Poki
integration. Browser offline cold reload is unsupported; no CDN delivery or
Poki acceptance threshold is invented. Physical Safari/WebGL/memory/storage,
touch/safe-area/pause-resume/share/export behavior remains device work.

Android artifacts here are unsigned base-game APK/AAB. Permanent upload signing,
Play App Signing/account, store ingestion/SDK/monetization decisions and real
device validation remain outstanding. iOS has no validated export preset/Xcode
project/archive/signing/capability result; macOS/Xcode, Apple account/profiles
and physical devices are required. Native/mobile release readiness remains **NO**.
