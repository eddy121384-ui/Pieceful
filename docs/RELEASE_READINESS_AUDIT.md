# Pieceful release-readiness audit

Audit date: 2026-10-04 (UTC). Repository: `eddy121384-ui/Pieceful`.
Branch: `hardening/release-readiness`, based on accepted UX/renderer commit `a66a851accb0b9198cff537263d69335816e4088`.

This audit inspects the accepted production scene, export configuration, source, generated production Web bundle, unsigned Android release APK/AAB, and actual Chromium runtime. It does not approve new gameplay or visual design. No store account, permanent signing key, physical mobile device, macOS or Xcode was available. The cloud network permits toolchain/package downloads but blocks the GitHub API, public Pages domain and live museum-provider verification. Local runtime evidence is not a verification of the deployed Pages site or Poki iframe.

## 1. Executive release status

**Web/Poki: not release-ready. Android/Google Play: not release-ready. iOS/App Store: not release-ready.**

Standalone Web is the closest: it exports in release mode, runs the accepted journey, restores progress in the tested browser, and handles a missing pack and unavailable initial storage. It has no Poki integration/approval, no offline reload support, and no physical Safari certification. Rights/privacy decisions and delivery-size acceptance remain open.

Android now has a demonstrated base-game release build: unsigned APK and AAB, valid bundle structure, SDK 24–36, arm64, Game category, sensor orientation, non-debuggable manifests, disabled OS backup, packaged notices, and 16 KB ELF alignment. This proves buildability, not installation, Play acceptance, native feature usability or commercial SDK readiness. iOS has no export preset and no demonstrated platform build.

The changes preserve the package ID and `application/config/name` to protect installed identity and the native `user://` save location. The visible Android label is Pieceful. No puzzle geometry, shader, piece renderer, snapping, merging, touch, layout transition, save format or timing was changed. The only player-facing addition is the existing confirmation sheet warning when Web starts without persistent storage.

### Platform requirement matrix

Each cell uses a requested classification. `READY` applies only to the requirement and evidence named in that row, in the **base-game profile without optional native ads/billing SDKs**. It never means the platform as a whole is certified. Where several gates exist, the cell names the first practical gate; the evidence/remaining-work column states the others. Source/unit evidence for a shared algorithm does not certify its platform lifecycle.

| Requirement | Web / Poki | Android / Google Play | iOS / App Store | Evidence / remaining work |
|---|---|---|---|---|
| Production export exists and builds | READY | READY | REQUIRES MAC / XCODE | Actual release Web, unsigned APK and AAB; no iOS preset/build. |
| Stable installed application identity | NOT APPLICABLE | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | Preserved `com.piecepace.puzzles`; Eddy must confirm Play ownership and reserve an iOS bundle ID/team. |
| Base version metadata | READY | READY | REQUIRES MAC / XCODE | `config/version=0.1.0`; AAB preset `0.1.0-internal`, code 1. iOS metadata absent. |
| Final release version / globally monotonic store build number | NOT APPLICABLE | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | Query previously uploaded builds; choose release number. Per-workflow run numbers are not a global store counter. |
| Release rather than debug artifact | READY | READY | REQUIRES MAC / XCODE | Release Web engine flag and effective stdout override; APK/AAB manifests not debuggable. |
| Exclude QA bridge / authoring / development resources | READY | READY | REQUIRES MAC / XCODE | Inspected shipping PCK and APK/AAB paths; browser QA bridge absent in production. |
| Engine/editor archive integrity | READY | READY | REQUIRES MAC / XCODE | SHA512 lock checked on downloads and cache hits. No Mac editor/iOS template validation. |
| Same-input Web content reproducibility | READY | NOT APPLICABLE | NOT APPLICABLE | Two exports compare every packed resource and delivery file; loader patch is idempotent. |
| Hermetic, byte-identical builds across fresh hosts | REPOSITORY FIX POSSIBLE NOW | REPOSITORY FIX POSSIBLE NOW | REQUIRES MAC / XCODE | Not demonstrated. Runner/JDK/SDK revisions and import UID/cache inputs are not fully hermetic. Dedicated build work remains; not a claim made by the new checks. |
| Required CI check / protected release branch enforcement | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | New validation workflow runs on this branch/main/PRs; Eddy must configure required checks and release approvals. |
| Store signing / provisioning / upload acceptance | NOT APPLICABLE | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | No permanent keystore/Play signing or Apple profiles/certificates used. |
| iOS Xcode project, archive, capabilities and minimum OS | NOT APPLICABLE | NOT APPLICABLE | REQUIRES MAC / XCODE | No iOS preset, generated project or deployment target evidence. |
| Poki SDK initialization/loading/gameplay lifecycle | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | NOT APPLICABLE | NOT APPLICABLE | No Poki SDK or loading/gameplay handshakes in shipping source. Partner requirements and integration still needed. |
| Browser/WebGL compatibility and embedding | REQUIRES REAL DEVICE | NOT APPLICABLE | NOT APPLICABLE | Chromium mobile emulation passed; Safari/WebKit, real Android Chrome and Poki iframe remain untested. |
| arm64 binary and 16 KB ELF/ZIP alignment | NOT APPLICABLE | READY | REQUIRES MAC / XCODE | Both native libraries have 16384-byte load alignment; APK `zipalign -P 16` passes. Final device-generated Play splits still need validation. |
| Android base manifest permission inventory | NOT APPLICABLE | READY | NOT APPLICABLE | Only INTERNET and ACCESS_NETWORK_STATE in inspected base artifacts; not a justification for future SDK permissions. |
| Final permission/capability review including SDKs | NOT APPLICABLE | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES MAC / XCODE | Base permissions and optional SDK choice need owner review; iOS entitlements/usage descriptions unknown. |
| Shared save transaction/recovery logic | READY | READY | READY | Existing isolated regression suites cover backup/temp recovery, corrupt slots, identities and stable snapshots; shared code only. |
| Actual platform sandbox/user storage lifecycle | READY | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Chromium IndexedDB reload tested. Native sandbox update/reinstall/file-protection behavior not exercised. |
| Initial browser storage denial disclosure | READY | NOT APPLICABLE | NOT APPLICABLE | Injected IndexedDB denial starts the game and displays loss warning; normal storage has no warning. |
| Quota exhaustion / storage eviction / private browsing | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Startup warning does not certify later async IDB write failures, OS disk-full behavior or eviction. |
| Save on pause/focus-out / resume / interrupted exit | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Notification flush exists and is regression tested logically; actual suspension/kill timing is not certified. |
| Missing Web pack startup state | READY | NOT APPLICABLE | NOT APPLICABLE | HTTP 503 injection shows visible loader error and never marks runtime ready. |
| Cold startup and recovery under platform memory pressure | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | No OOM/thermal/background eviction certification; large photo decode still occurs before resize. |
| Orientation configuration permits accepted portrait/landscape | READY | READY | REQUIRES MAC / XCODE | Web viewport QA; Android manifest now `fullSensor`, not default landscape lock. |
| Actual rotation / short landscape usability | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Portrait/short landscape emulation passed; native live rotation and split-screen not tested. |
| Native notch / cutout / Android edge-to-edge safe areas | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Web CSS env insets exist. Native `AppUiMetrics.safe_area_insets()` returns zero; integration plus device verification needed. |
| Local photo decode/hash/private save contract | READY | READY | READY | Shared store tests; canonical PNG, local registry and hash identity. No app-code upload transport. |
| Platform photo picker, URI/HEIC support and permissions | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Web accepts image/* but decoder supports PNG/JPEG/WebP. Native dialog capability fallback is not a verified mobile picker. |
| Photo memory/size limits on target devices | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | 4096-pixel long-edge resize follows full decode; no predecode byte/pixel cap. |
| Result share / accessible export on the target platform | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | REQUIRES REAL DEVICE | Web share/download fallback exists. Native implementation only writes sandbox PNG; no system share bridge. Native repository work also required. |
| Timelapse Web recording/download compatibility | REQUIRES REAL DEVICE | NOT APPLICABLE | NOT APPLICABLE | Web MediaRecorder capability path exists; native video export is explicitly unsupported/guarded. Validate Safari/device download UX. |
| Shared analytics event/privacy contract | READY | READY | READY | Sanitization and integration regressions pass; private photo identity not accepted as analytics property. |
| Analytics/crash vendor, consent and retention selection | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | Analytics is local bounded dev memory, remote provider disabled. No production crash transport. |
| Ads/commercial SDK scope and consent/age policy | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | No speculative ads added; current native IDs blank/test, real ads false. Poki contract may impose its own integration. |
| Purchase/restore in the actual store | NOT APPLICABLE | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | REQUIRES PLATFORM ACCOUNT / CREDENTIAL | Scaffolding only. SKU/store records, sandbox users, billing/store adapters and devices needed. |
| Paid entitlement verification/revocation/acknowledgement policy | NOT APPLICABLE | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | Local entitlement cache; ack response ignored, receipt/refund/deferred cases incomplete. Must resolve if purchases ship. |
| Privacy policy / data safety / App Privacy / ATT decisions | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | No policy invented; final host/SDK data handling must inform truthful disclosures. |
| Engine and font notice text packaged in verified exports | READY | READY | REQUIRES MAC / XCODE | Full engine notices, OFL/GUST and referenced LPPL included; iOS packaging unverified. |
| Original artwork/icons/shaders/code redistribution rights | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | No root project license/ownership evidence; inventory is not clearance. |
| Museum provenance evidence and final rights review | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | 35 CC0/isPublicDomain records preserved; source hashes validated, live provider not reverified. |
| Native Java/optional SDK notice and privacy inventory | NOT APPLICABLE | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | 38 resolved base Maven coordinates inventoried; notices/review and final SDK inventory remain open. |
| Release logging / default test-ad setup guard | READY | READY | REQUIRES MAC / XCODE | Release stdout disabled; GDScript refuses release test-ad setup. This is not a guarantee against installed SDK native auto-init. |
| Repository secret hygiene | READY | READY | READY | Blank tracked keystores; ignore rules; signing secrets step-scoped; no high-risk private-key/token markers found in 488 tracked files. Limited scan, not a security certification. |
| Content/catalog identity and source integrity | READY | READY | READY | 38 IDs/sources; 70 museum files and 80 source assets checked; shared identity/difficulty tests pass. |
| Cold download size / launch-time budget | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES REAL DEVICE | REQUIRES MAC / XCODE | About 70 MiB raw Web / 39 MiB potential gzip; unsigned Android about 54 MiB. No Poki budget agreement or low-end benchmark. |
| Accessibility requirements and release acceptance | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | Web canvas has no DOM semantic control journey; source has no keyboard piece alternative. Some large controls/focus/ESC exist. Native accessibility behavior is unverified. |
| Localization / supported-language declaration | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | English strings hardcoded; no translation catalogs. CJK font supports artwork titles, not localized gameplay. |
| Official icon/screenshots/descriptions/support URL/ratings | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | REQUIRES BUSINESS / LEGAL DECISION | Brand assets/store listings absent; Android export reports missing project icon and uses template fallback. |

## 2. Web / Poki readiness

The Web preset uses compatibility rendering, no threads/GDExtensions, no PWA/service worker. SharedArrayBuffer isolation headers are not needed for this preset. WebGL 2 and enough memory remain device requirements. The current branded watercolor loader and gameplay appearance are preserved.

The production pack is inspected independently from the browser fixture. Development scenes, tests, tools, authoring, curation, preview/build output and the editor-only catalog plugin are excluded; raw catalog source bytes are still deliberately included by the existing export plugin because save/content identity depends on them. Before hardening, the pack contained 594 entries, including 76 test resources and authoring/build/preview metadata, and lacked the added notices. The inspected hardened pack has 426 entries before the additional Android inventory notice (final count is in the evidence manifest).

Chromium proves the accepted gallery/setup/gameplay/unfinished/photo/history/completion journey, online persistence, portrait and short landscape, and Rail/Scatter presentation. Production has no QA callback. The fixture is a separate export and must never be published as the game.

Storage is origin-scoped IndexedDB mounted at `/userfs`. Host/domain changes do not migrate saves; previews on the same origin should not be assumed to have isolated databases. Browser site-data deletion and eviction can destroy local progress/photos. The initial unavailability warning added here does not turn later asynchronous persistence failures into confirmed successful disk writes.

The loaded tab remains running when disconnected, but a network-disabled reload fails; there is no service worker cache. Cold offline support is an owner scope decision, not an implemented promise. Do not advertise offline browser play or cloud backup.

No Poki SDK, partner initialization, loadingFinished, gameplayStart/Stop, ad handoff or Poki acceptance evidence exists. Hosting a working Godot page is not Poki release readiness. Eddy needs the partner account/specification, integration, embedded-origin/storage checks and portal approval. The local server does not verify HTTPS/mobile Safari share permissions, CDN gzip/Brotli, cache invalidation or production hosting headers.

## 3. Android / Google Play readiness

Both existing presets preserve `com.piecepace.puzzles`. The app label now reads Pieceful. The Game category was corrected from preset enum 0 (Accessibility) to 2 (Game); the manifest's Android category is consequently 0 (Game), not the preset enum number. The shared orientation setting is 6 (sensor), exported as Android `fullSensor`/13. It fixes a demonstrated default landscape lock without changing runtime layout/touch logic.

The cloud installed Java 17, platform 36, build-tools 36.1.0 and verified Godot 4.7.2 Android templates. The official source template uses Gradle 8.11.1, AGP 8.6.1 and Kotlin 2.1.21. Its AGP emits an unsupported-compileSdk-36 warning; this is not hidden or treated as certification. No speculative AGP/engine upgrade was made.

Unsigned stock-template APK and Gradle release AAB were built. Bundletool 1.18.2 validates the AAB and reads its actual protobuf manifest. APK/aab both contain the raw artwork sources/notices, only arm64 native libraries, no QA assets, no debuggable flag, allowBackup=false, and the two stated network permissions. APK ZIP and both artifacts' ELF alignment pass 16 KB checks. The AAB uses Godot's `assetPackInstallTime` module for game assets. Play-generated split APK behavior and 16 KB devices were not tested.

These are **base-game validation artifacts**, unsigned and not install/upload-ready. The optional AdMob/Google Play Billing plugins from the older sandbox/release workflow were not installed into these cloud builds. Their manifests, dependencies, native startup providers, size and licensing can change the result. The older CI-signed AAB job uses a throwaway key; it is not an upload-key ownership proof. The signed dispatch job still requires Eddy's permanent secrets and a reviewed SDK profile.

Remaining native product gaps include actual picker/content-URI/HEIC behavior, notch/edge-to-edge insets, accessible system sharing, background/force-stop recovery, low-memory photo import and rotation. These are not safely certified by Linux headless tests. The official app/adaptive/monochrome icon, store identity ownership, Play records, signing, data safety, ratings and pre-launch report are missing.

## 4. iOS / App Store readiness

There is no iOS export preset, bundle identifier, development team, provisioning/certificate configuration, generated Xcode project, target-OS declaration or archive evidence. No iOS binary was produced. The source's optional `InAppStore` adapter is not a confirmed installed StoreKit integration.

Eddy must set the genuine bundle/team identity, choose supported devices/OS/orientation, provide app icons/launch assets, export on Mac with the matching Godot templates, inspect generated Info.plist/entitlements/privacy manifests and all native SDK requirements, then archive and validate in Xcode. Native safe areas, photo picker/share sheet, protected files, lifecycle, audio interruptions, purchases/restores and memory pressure require physical iPhone/iPad tests. App Store Connect metadata, App Privacy, possible ATT/SDK requirements, ratings, signing and TestFlight/App Review remain untouched. Android/Web success cannot certify them.

## 5. Release blockers

1. **All platforms: rights and truthful disclosures.** Confirm distribution rights for project code, original fixture artworks, icon art and shaders; review museum records and final dependency notices. Decide actual SDK/data/monetization scope, privacy/support destinations, supported languages and accessibility requirements. No fabricated policy or project license was added.
2. **Web/Poki: partner integration and acceptance.** Implement the authorized Poki contract, verify embedding/storage/ads lifecycle, agree on size/performance budget, and test real Safari/Chrome. Standalone Web does not satisfy this gate.
3. **Android: identity, permanent signing and real native usability.** Choose store version above existing uploads; configure/secure the genuine upload key and Play signing; supply icons/listing; resolve native picker/safe-area/share gaps and device results. Validate the exact final SDK-bearing build, not only the base game.
4. **iOS: the whole platform build/signing pipeline.** Mac/Xcode plus real bundle/team/preset/capabilities, TestFlight and physical devices are prerequisites.
5. **If ads/purchases ship:** production IDs/SKUs, consent/age/region rules, SDK inventory, purchase verification and failure/refund/restore cases must be implemented/tested. Current scaffolding is not a commercial acceptance test.

## 6. Non-blocking issues and conditional gates

These are non-blocking only if Eddy explicitly chooses the corresponding limited release scope:

- No browser offline reload, cloud synchronization or cross-origin save migration. Native offline launch still needs device testing.
- English-only product. No localization catalog; don't claim unsupported languages from the template's translated launcher resources.
- Native timelapse video export is guarded as unsupported. Native result sharing is different: it is visible but only writes a private file, so resolve that usability gap before native release.
- No remote analytics/crash service; the local analytics contract is not a deployed dashboard. OS/store crash reports can be the initial operational route once accounts exist.
- Native test shutdowns retain existing CanvasItem/ObjectDB leak warnings, and corrupt-save fixture parsing intentionally prints errors. Investigate long-session/device memory; these do not turn passing assertions into crash certification.
- Build reproducibility is not hermetic across hosts. Two same-environment Web exports were compared; host image/JDK/SDK revisions, first-import metadata and signing still limit broader claims.
- Web size remains substantial. Removing developer assets saves packaging noise, not the need for low-end startup/download measurement; artwork/source identity cannot be silently removed to shrink it.

## 7. Security, privacy and configuration findings

The default app's photo import uses local FileReader/native dialog bytes, decodes PNG/JPEG/WebP, canonicalizes PNG, derives hash identity, and writes `user://puzzle_me/<hash>.png` plus a local registry. Original image metadata is not copied as original bytes into the canonical PNG; the filename-derived label is retained locally. No app-script HTTP photo upload or remote analytics transport was found. This does **not** describe host access logs, future Poki or optional native SDK data collection.

Photo import fully decodes before its 4096-pixel resize and has no upfront byte/pixel budget. The photo registry is written in place, unlike robust puzzle-save transactions; interrupted writes can lose the photo index. These risks need bounded-input/device/crash tests and careful follow-up to the accepted storage contracts. They were not disguised as fixed here.

Shared puzzle saves use local index/slots, autosave and pause/focus/exit flushing with backup/temp recovery and quarantine. The native application name was deliberately retained: renaming it can change `user://` on native systems. Android allowBackup=false was verified from output, not assumed. There is no app-owned cloud backup/export/migration path.

Release stdout suppression prevents ordinary application debug prints from shipping into normal consoles; errors remain visible for diagnostics. Engine startup/WebGL messages may still occur before project settings load. Private-file paths in failure diagnostics deserve review; suppression is not a complete personal-data logging policy.

Ad setup now refuses test mode in release and refuses blank/known test IDs for real mode before loading/attaching the GDScript AdMob node. Debug sandbox behavior is retained. **Installed SDK native manifest providers may still auto-initialize.** The installer populates test SDK configuration; no runtime guard can substitute for removing/reconfiguring/reviewing that SDK in the final signed build.

Purchase foundations persist local entitlements, query owned purchases and request Android acknowledgement. Acknowledgement response is ignored; entitlement/restore is not tied to validated receipts, refunds/revocation or deferred-flow coverage. iOS adapter presence is optional. Do not sell an IAP on the strength of the smoke tests.

No high-risk private-key/token markers were found in 488 tracked files at initial inspection. This limited marker scan is not a full secret-history audit. Signing fields remain blank; ignore rules cover keys/profiles/.env. Workflow inputs now enter shell via environment variables, signing secrets are scoped to necessary steps, shell tracing is removed from the permanent signing build, and temporary keys have always-run cleanup. Neither new CI job has publish/store/merge permissions. Branch protection and secret/account ownership remain manual.

## 8. Licensing and provenance findings

- `licenses/ASSET_MANIFEST.json` records 3 font files, 38 catalog artwork files and 39 other source assets (including museum thumbnails and project UI/shader assets), with actual SHA256 values. It explicitly says inventory, not legal clearance.
- 35 Met artworks carry existing CC0 and `isPublicDomain=true` records, creator/source/credit-line data; 3 fixture SVGs have no demonstrated ownership grant in the repository. Museum source/thumbnail hashes match the runtime manifest. Live provider rights were not reverified through the blocked network.
- Album regular/italic fonts identify **LM Roman 10, version 2.004**, copyright B. Jackowski/J. M. Nowacki (2003/2009). Existing GUST notice is retained; complete referenced LPPL 1.3c is added from the LaTeX project's source. Do not describe them as an unidentified proprietary font.
- Pieceful Catalog Ink is the documented, renamed Noto Sans JP subset; Adobe copyright and full SIL OFL are retained. CJK glyph coverage does not imply a localized interface.
- Engine license/copyright/full license bodies are extracted from verified Godot 4.7.2 using `Engine.get_license_text/get_copyright_info/get_license_info`; this can be overinclusive of editor dependencies. It is **not** the whole Android Java SDK inventory.
- `licenses/ANDROID-RUNTIME-INVENTORY.json` captures 38 resolved base-game Maven coordinates from the successful Gradle release runtime classpath. Their POM/source notices and any optional AdMob/Billing/StoreKit/other SDK notices require final distribution review. No copyright/license guesses were made for them.
- Added notices are packaged and source integrity is checked, but legal accessibility/credits placement and all owner rights still need review. No root MIT license, original-art grant, privacy policy, SDK consent policy or business clearance was invented.

## 9. Build and artifact findings / validation

Toolchain inputs: official Godot `4.7.2.stable.official.ed1daf0bf` archives, SHA512 pinned; Gradle 8.11.1 distribution SHA256 pinned; Java 17; Android min 24/compile-target 36/build-tools 36.1.0; checksum-locked publisher-hosted bundletool 1.18.2; Playwright 1.55.0. Local Java is Temurin 17.0.17+10; CI selects current Java 17. No claim of a locked OS/JDK patch/SDK revision or reproducible signing.

Final sizes, hashes and detailed results are recorded in [release-readiness-evidence/results.json](release-readiness-evidence/results.json). Gzip sizes are calculated potential compression, **not a measurement of production CDN responses**. Web consists primarily of ~37.7 MiB WASM and ~32.3 MiB PCK. Android APK/AAB are approximately 54.4 MiB each without optional monetization SDKs. AAB size is not installed/split download size. There is no iOS size estimate from a real artifact.

Validation performed:

- All 35 accepted native regression suites plus `release_runtime_smoke` (36/36), isolated `user://`, covering saves/recovery, photo store, catalog/identity, journal/completion, recommendation/analytics/monetization contract, accepted renderer/z-order, rail visibility and touch behavior. Shutdown warnings noted above remain.
- Seven targeted Python release tests: preserve catalog/unknown plugins, idempotent plugin enablement, dynamic preset selection/boundaries, bad version input, repo/content integrity, contaminated export configuration rejection, failure-time QA configuration restoration and shell-input boundary. Existing content-ingestion rights/registry smoke also passes.
- Actual release Web export, PCK inspection, raw catalog byte identity and bundled notices; two same-input exports and loader idempotency comparison. Production runtime readiness and the negative/runtime browser checks are recorded in evidence.
- Existing commercial browser flow: 38 journey assertions / 54 captures, no browser runtime errors. It includes real rendered input, multiple save slots, imported photo, reload/resume, completed history, portrait and short landscape.
- Existing animated Rail/Scatter browser suite and new production storage/startup checks: final results recorded in evidence. Device emulation is not physical-device evidence.
- Actual unsigned Android release APK/AAB, bundletool validate/protobuf manifest, packaged sources/notices, ABI, non-debuggable/backup/permission checks, ELF load alignment and APK ZIP alignment. No install, signing, Play upload, optional SDK build or emulator/device tests performed.
- Workflow YAML parse and diff whitespace check. The new hosted workflow run status must be checked for the pushed SHA; presence of YAML alone is not a passed CI run.

Reproduce on a clean validation checkout (Godot local SDK editor paths must be configured; Java/proxy/CA details are saved in the cloud environment setup notes):

```bash
export GODOT_BIN="$PWD/.godot-ci/Godot_v4.7.2-stable_linux.x86_64"
python3 tools/release/install_godot.py
"$GODOT_BIN" --headless --path . --editor --quit
python3 tests/release_readiness_smoke.py
python3 tests/content_ingestion_smoke.py
python3 tools/release/run_native_regressions.py
python3 tools/release/export_web.py
python3 tools/release/export_web.py --output build/release-web-repeat/index.html
python3 tools/release/compare_web_exports.py build/release-web build/release-web-repeat
# ANDROID_HOME and JAVA_HOME must refer to real installed SDKs.
python3 tools/release/configure_android_sdk.py
python3 tools/release/install_bundletool.py
python3 tools/release/export_android_validation.py --templates "$HOME/.local/share/godot/export_templates/4.7.2.stable"
python3 tools/release/inspect_android.py build/android-validation/pieceful-validation-unsigned.apk build/android-validation/pieceful-validation-unsigned.aab
```

The cloud's templates instead use `$XDG_DATA_HOME/godot/export_templates/4.7.2.stable`. Android validation refuses an existing `android/build` to preserve custom templates; rerun from a fresh validation checkout or remove only your known generated output. Never run project/preset-mutating exporters concurrently. For browser tests, use the workflow's two servers/environment variables and install Playwright 1.55.0. The QA exporter restores production settings even on failure. Generated build/editor import metadata must not be committed/published as source assets.

## 10. What was fixed

1. Added base version metadata, effective release stdout override, native sensor orientation; corrected Android launcher label/category and explicit target SDK. Preserved application/data identity.
2. Tightened all export filters to exclude developer/QA resources and include full notices; preserved raw catalog source bytes. Added build-directory ignore markers to prevent editor import sidecars becoming delivery artifacts.
3. Preserved existing/unknown editor plugins during mobile plugin installation, preventing catalog/source-identity export regression.
4. Fixed Android version helper's hardcoded preset/boundary handling and literal-newline behavior; validates unsafe/invalid inputs and writes only its named release preset.
5. Guarded GDScript AdMob setup in release; no commercial SDK or monetization policy added.
6. Added the existing-modal browser warning for unavailable initial persistent storage; no save implementation changes.
7. Added source/engine/font/native dependency inventories and notices without inventing original-asset rights.
8. Added checksum-locked tool installation, production artifact/source/permission/alignment checks, isolated native runner, Web reproducibility/idempotency checks and separate production failure browser tests.
9. Added CI for native/release/content/Web/unsigned Android validation and artifact retention, without deploy/store publication; pinned new/Android workflow actions. Hardened older Android workflow input/secret/key cleanup boundaries and SDK setup. The first hosted Android job exposed an unqualified `sdkmanager` PATH assumption; the installer now resolves it explicitly from `ANDROID_HOME`.

## 11. What still requires Eddy / manual / platform work

Eddy owns the final package/bundle identity, release number/code above previous uploads, store accounts/signing, icons/listings/screenshots/support/contact/ratings, legal rights and privacy declarations, supported languages/accessibility/offline promises, and whether any ads/IAP ship. Confirm the final SDK profile before any signed store build. Complete base Android Java and optional SDK notice/privacy reviews.

Engineering still needs the authorized Poki integration, native safe-area/picker/share implementations and platform-specific storage/lifecycle/resource tests. iOS needs its actual preset and Mac/Xcode integration. Run real iPhone/iPad/Android device matrices, Safari/WebKit, low-memory/disk-full/eviction and interruption testing; validate store sandbox purchases/restores/refunds if enabled. Configure required CI/status checks and release approvals in repository settings.

No store record, privacy policy, permanent key, iOS build, live-ad configuration, Poki approval, device certification, release deployment or merge was created by this audit.

## 12. Recommended exact release sequence

1. Review this hardening branch and its exact-SHA CI artifacts. Keep gameplay/renderer acceptance unchanged. Resolve legal/asset rights, SDK scope, privacy/support, accessibility/language/offline promises and official icons first.
2. Confirm `com.piecepace.puzzles` ownership or plan an explicit migration before changing it. Reserve the genuine iOS bundle/team identity. Choose SemVer and globally monotonic native build numbers using actual store history, not workflow-local counters.
3. Complete the Poki contract in a separate reviewed integration change; validate HTTPS hosting, compressed sizes/cache policy, iframe-origin persistence and required lifecycle/ads. Test standalone and embedded Web on physical Safari/Chrome and low-end devices.
4. Complete the native picker, insets/edge-to-edge, system sharing and lifecycle/resource gaps. Re-run the accepted regression suite plus physical Android tests (API 24 baseline and current API/16 KB hardware or emulator, rotation/cutouts, background/kill, photos, disk failures).
5. Produce the reviewed Android SDK profile; configure the genuine upload key with Play App Signing and the correct version code. Inspect the final signed AAB/permissions/notices/16 KB-generated splits; use internal testing and Play pre-launch reports. Clear data safety/content ratings/listing requirements before production rollout.
6. On Mac, add the genuine iOS preset/metadata/capabilities with matching templates, export/archive/validate in Xcode, review SDK privacy manifests/entitlements, test physical iPhones/iPads and StoreKit sandbox if used, then TestFlight. Complete App Privacy, ratings, screenshots/support and App Review requirements.
7. For any ads/IAP, independently accept consent/age/region, transaction verification/acknowledgement, restore/refund/deferred/failed-network behavior and final SDK notices on each platform. Do not enable real monetization just to make a build pass.
8. Freeze and tag a reviewed release commit with its input lock, CI evidence and platform-specific signed artifact identities. Use staged store rollout/Poki publication, watch account-backed crash/issue reports, and retain a tested rollback/update path. Publication and merging remain explicit owner actions.
