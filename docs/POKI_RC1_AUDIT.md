# Pieceful — Poki Edition RC1 audit

Evidence collected 2026-10-08 UTC. Branch `release/pieceful-poki-rc1` was created from fetched `origin/main` **e04f0305fb54e3f30ee3b766a89d3105f1986daf**. Submission ZIP runtime/build source: **f4eb7f9a30aaffc4286dc346b8234053f302e9e7**, clean when exported. Later commits add test coverage, measurements and this report, without changing the exported runtime. Main, existing Pages and platform submissions are untouched.

**Verdict: NO-GO for public Poki submission.** The isolated engineering implementation and all 35 selected images work in the scoped Chromium checks. Size/startup guidance, live SDK/platform acceptance, actual target-device performance, Inspector and owner distribution decisions remain gates. A ZIP is not release approval.

## 1. Current official Poki requirements

Live official pages were retrieved over the managed HTTPS proxy on 2026-10-08 after initially blocked requests. No TLS verification was disabled. Research snapshots and individual fetch hashes are recorded in `poki-rc1-evidence/research.json`; links below are the authoritative source, not historical assumptions.

| Official source | Verified requirement / guidance | RC1 evidence and limit |
| --- | --- | --- |
| [Requirements](https://developers.poki.com/guide/requirements-quality) | Desktop/mobile/tablet; fullscreen responsive layout; scalable 16:9 at 640×360, 836×470, 1031×580; functional incognito; bundle assets/fonts; no external ads, purchases, external promotional links or own ad-frequency system. | Five browser sizes and real 1031×580 iframe tested; denied storage remains playable. Smaller 640×360/836×470 and physical Safari remain manual. No payment/native-ad surface. |
| [HTML5 SDK](https://developers.poki.com/guide/sdk-html5) and [SDK overview](https://developers.poki.com/guide/sdk-overview) | `init(): Promise`; `gameLoadingFinished()`, `gameplayStart()`, `gameplayStop()`; `commercialBreak(onStart?): Promise<void>`. No consecutive duplicate start/stop; gameplay begins on genuine input; stop at menus/pause/completion; disable input and mute for ads. | Bridge uses these methods exactly. Promise resolution does **not** prove an ad was shown. Explicit QA validates ordering; live initialization timed out here. |
| [Requirements](https://developers.poki.com/guide/requirements-quality), [Monetization](https://developers.poki.com/guide/monetization) | Commercial breaks on the way **back into gameplay**, never while going into level selection; let SDK decide frequency. | Completion → Gallery has no ad. Only subsequent real Start consumes a completion opportunity. No rewarded mechanic or custom frequency timer. |
| [External resources](https://developers.poki.com/guide/external-resources-policy) | External calls normally blocked unless approved by owner/CSP/policy; bundle game resources. | All game content is local. Only required official SDK is referenced externally. Its own platform/ad dependencies must work in the actual authorized environment. |
| [Web engines](https://developers.poki.com/guide/web-engine) | Article says “initial download should not exceed 5MB and 8MB in total”; compares compressed empty projects, including roughly 10MB Godot. | This is verified article guidance, **not an invented hard acceptance limit**; exact accounting/units need partner confirmation. RC1 exceeds it even with gzip. Project's <30MB preference is separate: raw fails, calculated gzip/ZIP are below it. |
| [Content/player safety](https://developers.poki.com/guide/content-player-safety) | Family-friendly content and platform moderation; originality in a crowded genre. | CC0 is a rights status, not content-policy approval. Museum human figures/putti and cultural content require owner/Poki review. No claim of moderation approval. |
| [Adding game](https://developers.poki.com/guide/adding-your-game), [Web fit test](https://developers.poki.com/guide/web-fit-test), [Playtesting](https://developers.poki.com/guide/playtesting) | Owner account/game setup, test/submission process; static and animated game thumbnails required for global release. | No account/upload/submission performed; platform-facing static/animated game thumbnails still missing. This does not refer to the 35 in-game artwork thumbnails. |
| [Inspector](https://developers.poki.com/guide/inspector) | Use official Inspector to validate actual hosted SDK integration. | Public page/source reachable; hosted ZIP upload deliberately not performed. MANUAL / UNVERIFIED. |

No Poki acceptance FPS, memory ceiling, exact audience hardware distribution or accepted legal policy was invented. The player-device report rendered a data-loading shell, so no percentages are asserted.

## 2. Competitor research

Public game pages were fetched; embedded gameplay/network traces were not reliably inspected. Claims below are **page descriptions**, not hands-on observations.

| Page | Observable claim | Artwork / first-play / download limits |
| --- | --- | --- |
| [Jigsaw Surprise — TapLab](https://poki.com/en/g/jigsaw-surprise) | Three difficulties, several modes, daily changing image; country/city/culture themes; cursor/finger play and desktop/phone/tablet listing. | Distinct image and level totals not established; no measured startup, session duration or exact action count. |
| [Jigsaw Gems — Monoinyo](https://poki.com/en/g/jigsaw-gems) | Ten packs, gems unlock packs, daily/weekly challenges, retro presentation; mobile/tablet listing. | Ten packs is not an artwork count. Actual unlock economy and network behavior unverified. |
| [Photo Puzzle: Jigsaw Edition — Avix](https://poki.com/en/g/photo-puzzle-jigsaw-edition) | 500 levels; easy/normal/hard; click or drag; desktop/phone/tablet listing. | **500 levels does not establish 500 distinct artworks**. Actual first-run screens, daily progression and network payload unverified. |

Useful supported principles: a direct first puzzle, clear difficulty choice, varied identifiable content and a straightforward completion/next loop. RC1 adopts these without copying assets/code or adding unlocks, currencies, daily retention systems or speculative incentives.

## 3. Final Poki product scope

New player: existing loading curtain → featured `met_10181` setup → Start. One meaningful action; choosing another difficulty adds a selection action. Returning players use the accepted saved-slot/Gallery flow in their own namespace. No tutorial gate or forced progression.

Retained: accepted watercolor/paper controls/fonts, cardboard ContactShadow/Thickness/Face/EdgeRelief, native-aspect geometry, snapping/merging/z-order, real touch/mouse, pinch/pan, Rail/Scatter, picture reference, progress/save/resume/completion records, all 35 artworks, search and theme browsing. Added only profile pause/SDK handoff. There are no bundled music/sound resources to add a new audio preference for; existing AudioServer mute ownership is preserved and tested.

Hidden and action-guarded only here: photo upload, advanced collections/favorites/status filters, History/Journal navigation, settings, native share/export, Replay/timelapse and app-specific monetization. Completion records remain saved; expensive share-card/video preparation is skipped. These features remain available in the Full App. Existing full-App code, renderer, shaders, cuts, touch code and save schemas are unchanged.

## 4. Exact artwork selection

**35 distinct approved museum originals**, with 35 different original SHA256 values and 35 existing derivatives. Difficulty/thumbnail variants are never counted as additional artwork. Canonical IDs, original hashes, paths, creators, credit lines and metadata are preserved. Generated `artwork-manifest.json` and the packaged ASSET_MANIFEST record individual evidence.

| Stable ID / official object page | Existing label | Creator | Metadata recommendation | Puzzleability score |
| --- | --- | --- | --- | --- |
| [met_10181](https://www.metmuseum.org/art/collection/search/10181) | Landscape | Ralph Albert Blakelock | hard | 0.7968 |
| [met_359362](https://www.metmuseum.org/art/collection/search/359362) | Landscape | Edgar Degas | standard | 0.5803 |
| [met_335112](https://www.metmuseum.org/art/collection/search/335112) | Landscape | Gillis van Coninxloo | relaxed | 0.4114 |
| [met_11181](https://www.metmuseum.org/art/collection/search/11181) | Landscape | William Morris Hunt | standard | 0.7106 |
| [met_394043](https://www.metmuseum.org/art/collection/search/394043) | Flowers | Jean Pillement | standard | 0.4956 |
| [met_438031](https://www.metmuseum.org/art/collection/search/438031) | Summer Flowers | Henri Fantin-Latour | standard | 0.6811 |
| [met_12802](https://www.metmuseum.org/art/collection/search/12802) | Summer Flowers | Jerome B. Thompson | standard | 0.7582 |
| [met_312624](https://www.metmuseum.org/art/collection/search/312624) | Animal | Unidentified artist | standard | 0.6519 |
| [met_478746](https://www.metmuseum.org/art/collection/search/478746) | Animal | Unidentified artist | standard | 0.6205 |
| [met_478425](https://www.metmuseum.org/art/collection/search/478425) | Animal (?) | Unidentified artist | standard | 0.4385 |
| [met_226943](https://www.metmuseum.org/art/collection/search/226943) | Portrait | A. Bois | standard | 0.6065 |
| [met_191566](https://www.metmuseum.org/art/collection/search/191566) | Portrait | Unidentified artist | standard | 0.625 |
| [met_191567](https://www.metmuseum.org/art/collection/search/191567) | Portrait | Unidentified artist | standard | 0.6056 |
| [met_340070](https://www.metmuseum.org/art/collection/search/340070) | Portrait | Ercole Procaccini The Younger | relaxed | 0.41 |
| [met_21209](https://www.metmuseum.org/art/collection/search/21209) | Self Portrait | Unknown Artist | standard | 0.6495 |
| [met_399581](https://www.metmuseum.org/art/collection/search/399581) | Architecture | Michelangelo Colonna | standard | 0.461 |
| [met_202696](https://www.metmuseum.org/art/collection/search/202696) | Architecture | Clodion (Claude Michel) | standard | 0.6048 |
| [met_399347](https://www.metmuseum.org/art/collection/search/399347) | Architecture (Arquitraicture) | Etienne Delaune | standard | 0.4173 |
| [met_394310](https://www.metmuseum.org/art/collection/search/394310) | Architecture | Johann Georg Hertel | standard | 0.5055 |
| [met_394709](https://www.metmuseum.org/art/collection/search/394709) | Architecture | Louis Félix de La Rue | standard | 0.4483 |
| [met_5410](https://www.metmuseum.org/art/collection/search/5410) | Night Table | Herter Brothers | standard | 0.6287 |
| [met_221706](https://www.metmuseum.org/art/collection/search/221706) | Night cap | Unidentified artist | standard | 0.5587 |
| [met_54393](https://www.metmuseum.org/art/collection/search/54393) | Night Scene | Yashima Gakutei | hard | 0.7389 |
| [met_215356](https://www.metmuseum.org/art/collection/search/215356) | Night cap | Unidentified artist | standard | 0.6721 |
| [met_228950](https://www.metmuseum.org/art/collection/search/228950) | Night cap | Unidentified artist | standard | 0.5346 |
| [met_505626](https://www.metmuseum.org/art/collection/search/505626) | Koto (箏) | Metalwork by Goto Teijo, 9th generation Goto master, Japan | standard | 0.7204 |
| [met_728305](https://www.metmuseum.org/art/collection/search/728305) | Temple of Kamakura, Japan | John Thomson | standard | 0.719 |
| [met_764802](https://www.metmuseum.org/art/collection/search/764802) | [Japanese Infantry, Yokohama, Japan] | Unknown | hard | 0.7679 |
| [met_10189](https://www.metmuseum.org/art/collection/search/10189) | Street Scene in Ikao, Japan | Robert Frederick Blum | standard | 0.6848 |
| [met_436305](https://www.metmuseum.org/art/collection/search/436305) | Still Life | Georg Flegel | standard | 0.6216 |
| [met_10996](https://www.metmuseum.org/art/collection/search/10996) | Still Life | William Michael Harnett | standard | 0.7483 |
| [met_286248](https://www.metmuseum.org/art/collection/search/286248) | [Still Life] | Louis-Rémy Robert | standard | 0.5546 |
| [met_898372](https://www.metmuseum.org/art/collection/search/898372) | Still Life | Fidelia Bridges | relaxed | 0.3648 |
| [met_54333](https://www.metmuseum.org/art/collection/search/54333) | Still life | Unidentified artist | standard | 0.5758 |
| [met_54988](https://www.metmuseum.org/art/collection/search/54988) | Cherry Flowers | Kikuchi Yōsai | relaxed | 0.4099 |

Excluded as still REVIEW_REQUIRED: `garden`, `twilight_lake`, `crane_pine_scroll`. The inherited frozen class preloads its fallback path; staging substitutes a generated blank paper SVG there. None of the three original fixture bytes is shipped or counted. Ordinary builds retain their existing catalog.

## 5. Artwork classification

The authoritative authoring registry and existing generator/validator remain the source of truth. A deep-copied catalog projection preserves `category`, `subject`, `mood`, `style`, `visual`, `scene`, `region_culture`, weighted tags, puzzleability and recommendations. Theme membership is generated from those fields, with no asset copies or quotas.

| Theme | Count (overlapping) | Canonical IDs |
| --- | --- | --- |
| Nature & Landscapes | 5 | met_10181, met_359362, met_335112, met_11181, met_12802 |
| Animals | 3 | met_312624, met_478746, met_478425 |
| Flowers & Gardens | 5 | met_394043, met_438031, met_12802, met_898372, met_54988 |
| Cities & Architecture | 7 | met_399581, met_202696, met_399347, met_394310, met_394709, met_728305, met_10189 |
| Portraits & People | 10 | met_11181, met_12802, met_226943, met_191566, met_191567, met_340070, met_21209, met_54393, met_764802, met_10189 |
| Objects & Still Life | 10 | met_5410, met_221706, met_215356, met_228950, met_505626, met_436305, met_10996, met_286248, met_898372, met_54333 |
| Calm & Atmospheric | 20 | met_10181, met_359362, met_335112, met_11181, met_394043, met_438031, met_12802, met_226943, met_191566, met_191567, met_340070, met_21209, met_728305, met_764802, met_436305, met_10996, met_286248, met_898372, met_54333, met_54988 |

Membership overlaps; sums exceed 35. Empty themes are not shown. No unsupported “Classical Art” quota was invented. Accepted curator overrides are preserved for `met_335112`, `met_340070`, `met_399347`, `met_898372`, `met_54988`; they were not reclassified by this work.

## 6. Rights and attribution status

Build validation requires each existing registry record to be APPROVED/CC0 with commercial/redistribution/derivative flags, individual review evidence, matching immutable Met baseline attribution/license URLs, and `isPublicDomain: true`. Both original and thumbnail hashes are recomputed. Thirty-five separate live Met object API responses were checked: **35/35 object IDs, public-domain signals and primary-image URLs match the immutable runtime records**. The dated evidence is `poki-rc1-evidence/met-live-verification.json`. The offline build does not depend on live API availability.

Creator, source object URL, original image URL, license URL and credit line remain in runtime metadata and submission manifest. Existing records say attribution not legally required under CC0; metadata/notices are retained anyway. Live provider evidence is not legal advice, an ownership grant for project code or Poki moderation approval.

Eight required notices were found in the production pack, including Godot MIT/third-party notices, LM Roman/GUST/LPPL and the renamed Noto Sans JP subset/SIL OFL notice. Existing unresolved ownership of original project code/icon/shaders remains an owner/business gate. No root license or privacy policy was fabricated. Native optional SDK rights are not claimed cleared by a Web export.

## 7. Difficulty selection design

Quick reuses **existing Classic_012_A exactly**, with isolated ID `poki_quick`; no generator/geometry change. The accepted density resolver has a minimum near 36, so requesting nominal 12 through it would mislabel the resulting puzzle. Quick uses the existing board preparation and die instead.

Other choices preserve existing IDs and responsive aspect-aware resolver: Relaxed (Easy guidance), Standard (Normal guidance), Hard. Guidance is typically 12–40 / 40–150 / 150–286, not a forced restriction. Image difficulty is separately stated from original puzzleability metadata. Feature art resolves to **35 / 140 / 280**, while representative browser cases actually render **40** (`met_12802` Relaxed), **150** (`met_335112` Standard), **286** (`met_12802` Hard). The existing resolver can reach **300** on `met_359362`; no hard cap or new geometry is imposed. All four frozen classic pattern resources remain packaged. High-count capability stays available, with physical-device performance explicitly gated.

## 8. Architecture and export profile

`poki/profile.json` freezes selection/namespace/theme rules. `tools/poki/catalog.py` runs the authoritative validator and produces the compatible subset. `tools/poki/build.py` owns an isolated staging project below `build/`, changes only staged project identity/main scene, imports/exports the dedicated preset and constructs the ZIP. Source catalogs/project files are never rewritten during profile builds. A shared catalog mutex covers the **entire** staging/import/export/package operation; concurrent builds fail fast. Unexpected files/unowned staging destinations are refused rather than deleted broadly.

`poki/main.tscn` composes the accepted Main/Board/Camera/Sorting/Save/Analytics. Profile subclasses extend accepted product, completion board and save coordinator. No second piece renderer. Ordinary Web/Android presets exclude `poki/*`; actual ordinary packs confirm no profile assets.

Single-thread stock Web export, no extensions or SharedArrayBuffer/header dependency; PWA disabled, relative local resources. Explicit QA builds alone add probes and stub. Production has official SDK script plus local bridge, no success stub or callbacks. Production logging remains suppressed by accepted release settings.

Catalog identity uses existing build-time immutable hashes; **zero duplicate raw catalog images in the PCK**. Native user photos continue hashing user bytes in the Full App. Poki uses `user://` under **Pieceful-Poki-RC1** without migrating Full-App slots. Structurally valid saves whose artwork is unavailable are filtered from automatic resume and preserved byte-for-byte/index intact, rather than quarantined as corrupt. Actual malformed identity still follows accepted validation. Pause/focus saving guards bootstrap/resume, preventing provisional runtime from overwriting a restoring slot.

Current content architecture is **all game content bundled, decode on demand**. Thumbnails use existing small derivatives, visible/near-visible margin 180 logical pixels, at most one decode per frame/80ms cadence and LRU ≤12; eviction clears all button texture references. Full-art cache remains the inherited one-active-texture cache. Setup holds only its thumbnail; Gallery clears it. Difficulty previews read validated dimensions without decoding artwork. A provisional featured 40-piece board still decodes one full artwork during boot; this is **not** zero eager full-art loading.

## 9. Asset/package size comparison

Fresh ordinary production baseline was exported before profile implementation, not copied from historical numbers. All values below are **bytes**; MB uses decimal bytes, MiB only where explicitly stated. Gzip here is calculated per delivery file with `mtime=0`, not observed Poki CDN transfer. Bundle comparisons include export outputs/RC1 manifests, but omit ordinary build-info/artifact-manifest sidecars used only for audit. RC1 manifests add delivery bytes and are counted.

| Component | Fresh main baseline | RC1 | Delta |
| --- | --- | --- | --- |
| WASM raw | 39,514,754 | 39,514,754 | +0 |
| PCK raw | 15,816,400 | 15,797,028 | -19,372 |
| Bundle raw | 55,667,593 | 55,713,908 | +46,315 |
| WASM calculated gzip | 10,054,758 | 10,054,758 | +0 |
| PCK calculated gzip | 12,517,859 | 12,446,213 | -71,646 |
| Bundle calculated gzip | 22,684,308 | 22,622,818 | -61,490 |

Final ZIP: **22,624,008 bytes**, SHA256 `56716efcc1d717b743a0181e21a89ca79173468b46da1035f561510abe4cbb52`. PCK: 397 entries; 35 verified canonical source identities/35 imported artworks/0 duplicated raw originals; no forbidden QA paths/missing notices. Original full-art quality, derivatives, fonts and cut patterns unchanged.

Ranked actual PCK payload inventory (directory/alignment overhead excluded):

| Category | Resources | Raw payload bytes | Sum of individually calculated gzip bytes |
| --- | --- | --- | --- |
| full artwork (35 imported resources) | 70 | 9,772,686 | 9,773,611 |
| cut patterns | 5 | 4,241,512 | 1,272,429 |
| scripts / scenes / remaps | 219 | 654,020 | 654,217 |
| thumbnails (35 imported resources) | 70 | 501,958 | 502,200 |
| metadata / notices | 14 | 389,101 | 73,793 |
| fonts | 2 | 138,991 | 138,995 |
| Godot generated metadata | 3 | 30,285 | 7,473 |
| UI / plain-paper fallback | 10 | 23,872 | 20,651 |
| shaders | 3 | 4,916 | 2,482 |
| other / project binary | 1 | 1,518 | 638 |

Each art category's 70 resources includes 35 tiny import remaps, not 70 images. Payload gzip sums **do not equal whole-PCK gzip**, especially Godot compiled scripts already compressed. Detailed ranked paths/MD5/offsets are in `poki-rc1-evidence/package-inventory.json`. Largest single cut file is Classic_286_A (~2.58MB); all required classic cuts retained. Metadata is small relative to art and engine. No demonstrated mass of QA/duplicate raw art remains to remove.

PCK drops only about 19KB; the raw bundle slightly grows because the 35-artwork rights manifest and bridge are added. This is principally a **decode/cache/first-play improvement**, not a large download-size win. The preferred <30MB raw goal remains missed; calculated gzip and ZIP are below 30MB. Neither means that all 22.6MB must be transferred on every warm load.

## 10. Startup performance comparison

Three cold-context/warm-reload pairs per profile/delivery, interleaved profile order. Raw assets use unthrottled loopback; gzip JS/WASM/PCK use **20Mbps down/10Mbps up, 40ms CDP latency**. Entry directory HTML is served raw. Browser 151.0.7922.173, 390×844, DPR1, Chromium software WebGL/SwiftShader. Other browser jobs stopped. HTTP body bytes and encoded wire bytes are observed locally; **not Poki CDN measurements**. Official SDK URL is explicitly blocked via CDP to isolate bundle delivery, with observable failed initialization and no success stub. Platform SDK/ad-network transfer and initialization overhead are excluded.

| Profile | Delivery | Cache context | Engine ready seconds: median (range) | Real Poki usable boundary seconds: median (range) | Observed total encoded wire bytes: median |
| --- | --- | --- | --- | --- | --- |
| Full App | raw | cold | 7.733 (7.274–10.715) | Not instrumented in shipping baseline | 55,646,767 |
| Full App | raw | warm | 7.220 (6.350–10.602) | Not instrumented in shipping baseline | 55,331,776 |
| Full App | gzip | cold | 21.238 (17.726–22.689) | Not instrumented in shipping baseline | 22,676,852 |
| Full App | gzip | warm | 19.941 (16.924–20.806) | Not instrumented in shipping baseline | 22,573,241 |
| Poki | raw | cold | 7.837 (7.066–9.052) | 12.830 (10.447–13.415) | 55,631,786 |
| Poki | raw | warm | 6.817 (5.874–7.228) | 10.670 (8.791–10.989) | 55,312,404 |
| Poki | gzip | cold | 16.625 (16.530–17.980) | 19.976 (19.975–22.099) | 22,606,967 |
| Poki | gzip | warm | 16.340 (14.292–16.723) | 19.418 (17.462–20.224) | 22,501,595 |

Baseline engine-ready is `Godot.startGame()` completion, **not** first Gallery usability; comparing that column to Poki usable would be misleading. Timeline fields overlap rather than sum:

| Cold case | HTML/bootstrap DCL seconds | WASM response complete seconds | PCK response complete seconds | instantiateStreaming wall seconds (includes download) | Post-assets/instantiate → engine-ready seconds |
| --- | --- | --- | --- | --- | --- |
| baseline/raw cold | 0.135 | 0.650 | 0.541 | 0.556 | 6.903 |
| baseline/gzip cold | 0.215 | 8.670 | 9.722 | 8.464 | 11.562 |
| poki/raw cold | 0.188 | 0.600 | 0.435 | 0.508 | 7.239 |
| poki/gzip cold | 0.235 | 8.642 | 9.677 | 8.439 | 6.968 |

`instantiateStreaming` includes network and compile; it is not isolated CPU compilation time. Game usable is a real layout/bootstrap boundary, not a pixel-perfect first-paint measurement. First loader paint/first visible game pixels were not separately timed.

Explicit release-engine QA markers: same profiling run Full Gallery usable **11.318s**, Poki featured setup actionable **11.356s**. Poki first actual Start → observed playable **1.659s**, navigation → observed gameplay **19.292s**. The latter includes deliberate sampling and waiting for the QA callback. A separate fresh-browser Full-App control uses real search/artwork/Start input for the same `met_10181` 35-piece game: Gallery **18.839s**, Start → playable **2.258s**, navigation → playable **38.344s**. That includes search/capture waits and a different browser-cache history; **not a controlled causal first-play speedup**. New-player RC1 still removes Gallery discovery as a product action, independently verified in five viewports.

Important cache finding: warm contexts show cache hits for small JS, but **WASM and PCK still return 200 and transfer their entire bodies** (raw and gzip). A warm context is not a promised fully cached load. Cache-size/streaming/private-context behavior is a hypothesis requiring normal-profile/CDN investigation, not an established production cause. An earlier harness version used Playwright routing, which disables HTTP caching; that run was stopped/discarded. Final data uses CDP URL blocking and explicitly enables HTTP cache, with actual cache-hit/transfer fields retained.

Largest current limit: even the gzip cold usable median is ~20 seconds in this environment. The verified article's “players move on” loading guidance and 5MB/8MB size recommendation are missed. No statistically established startup win or physical-phone timing is claimed. Successful hosted SDK loading, real devices, actual Content-Encoding/cache headers and slower networks remain release work. Complete traces: `poki-rc1-evidence/performance.json` and `full-runtime-control.json`.

## 11. Memory measurements

Actual release-engine QA counters, same representative artwork/counts, software-rendered 390×844 DPR1. Full control is a separate fresh browser; numbers are descriptive samples, not matched statistical device benchmarks. Table uses final sample per phase. WASM is **linear-memory capacity**, GPU texture counter is Godot accounting, process is Godot CPU monitor, FPS reflects SwiftShader; these are separate scopes.

| Pieces | WASM bytes Full / Poki | Texture bytes Full / Poki | Poki nodes | Poki draw calls | Poki process ms | Poki software FPS |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | 83,689,472 / 69,730,304 | 41,650,172 / 17,880,734 | 1055 | 183 | 43.9 | 8 |
| 150 | 83,689,472 / 83,689,472 | 42,097,478 / 18,788,045 | 1720 | 623 | 29.5 | 3 |
| 286 | 100,466,688 / 100,466,688 | 41,650,172 / 18,340,739 | 2541 | 1170 | 48.4 | 1 |

Initial Full Gallery texture accounting **33,523,335 bytes** versus Poki featured setup **18,708,230** (different first art/scope). Same-art 40/150/286 texture reduction is about 23MB, reflecting deferred bounded thumbnails, excluded original fixtures and simplified profile. Original 1800px museum art remains unchanged. No FPS speedup is claimed: Full control software FPS also varies at 4/2/2. Godot CPU process time omits important driver/frame costs.

Twelve actual Rail↔Scatter transitions at 286 pieces preserve the four shared cardboard layers. WASM capacity stays **100,466,688**; texture counter **18,471,811**, nodes **2596** (55 more than the pre-transition sample), draw calls unchanged at 1170. This small node increase is **not** a proven leak or a proof of no leak; persistent UI/temporary cleanup needs longer device tracing. No accepted renderer alteration was made on that evidence.

After eight different puzzle switches and three Gallery cycles, full-art cache remains 1, thumbnails at 8 (limit12), WASM capacity stays **100,466,688**, nodes **1145**, texture accounting **30,985,007**. Texture accounting rises as thumbnails/font/driver state warm and different image sizes are selected; this is not labeled leak-free. Completion returns to 12 pieces, records history, and skips hidden share/video preparation. All 35 separate browser artwork selections also verify full cache1/thumbnail≤12 including eviction.

V8 used heap at 40/150/286 is approximately 15.6/10.4/11.4MB; separate raw heap/backing-store and process RSS samples are preserved. Browser-wide RSS includes GPU/services/prior startup contexts; it is **not game-only or physical mobile peak memory** and must not be summed with overlapping Godot/WASM metrics. Godot static memory and orphan counters report zero in release, with `orphans_available:false`: **unavailable**, not “no orphans.” No valid physical peak-memory ceiling is certified. Known headless shutdown warnings remain noted below.

No per-piece artwork copies or changes to shared renderer design were introduced. Sampling/caches support keeping the isolated improvement, but real GPU FPS, long-session allocations, GC, tab suspension, context loss and pressure must gate high-count release.

## 12. Godot WASM bottleneck findings

Stock pinned Godot **4.7.2.stable.official.ed1daf0bf** WASM is unchanged: 39,514,754 raw bytes. Its gzip alone exceeds the verified article's 5MB initial guidance; it also exceeds the project's 30MB raw total preference before game content. Progressive art packs cannot solve that engine floor.

Official 4.7.2 source `SConstruct` and `platform/web/detect.py` were inspected: supported `disable_3d`/module flags, Web size optimization and production automatic LTO exist. Actual stock template compiler overrides/LTO were not established from the binary, and **no smaller template was built/measured**. A cautiously trimmed compatible engine is technically plausible but requires Emscripten/toolchain pinning, an explicit necessary-module inventory and complete shader/2D/font/JPEG/PNG/input/save/renderer tests. No speculative engine flags, unsupported version downgrade or port was shipped.

Local relative on-demand PCK(s) within the same submission could defer ~9.8MB art payload and optional patterns until selection, with catalog/thumbs/notices initially bundled. This needs approved platform delivery semantics, deterministic mounting, missing-pack save availability, progress/error/retry design and browser offline/cache tests. There is no assumed third-party CDN. It would not lower total 22.6MB compressed delivery or the stock engine floor; native/full-App offline bundles must remain intact. Not implemented because the evidence does not justify that architectural risk in RC1. Provisional-board deferral likewise requires accepted startup/resume ordering work and is documented rather than guessed.

## 13. SDK integration and event traces

Production URL: `https://game-cdn.poki.com/scripts/v2/poki-sdk.js`; Godot 4 JavaScriptBridge talks to a small local adapter, not the historical Godot 3.4 plugin. Official npm-sdk README/API source was checked at commit `50ab81c8e144b57b628bdd2614207d79e65745af`; no CLI account/upload performed.

Usable boundary = accepted save/bootstrap curtain complete + first setup/Gallery layout frame. `gameLoadingFinished` is emitted once **only after successful SDK init and usable screen**. Real Start/Continue/input enters gameplay; Gallery/setup/pause/overflow/completion/hidden/focus loss stops it. Desired/actual state deduplicates events. Init missing/rejected/12s deadline failure remains failed; SDK method exceptions stop retries. Ad Promise rejection remains rejection; resolution without onStart remains no-fill/unknown display, never “ad shown.” Diagnostics are bounded to 128 events and contain no photo/save IDs.

Expected explicit-QA trace: `initRequested → init → usable → gameLoadingFinished → gameplayStart → gameplayStop`; completion → Gallery adds no commercial request; real next Start → `commercialRequested → commercialStarted? → commercialResolved/rejection → gameplayStart`. Exact per-scenario traces are in `poki-rc1-evidence/sdk-browser-traces.json`. Seven JS bridge regression cases pass, including input/focus/duplicate/midroll/rejection/no-fill behavior.

**Live validation is incomplete.** Real official loader/core JavaScript was fetched through the session HTTPS proxy and executed unchanged in local Chromium (no fake successful init). Downstream geo/ad/IMA/Prebid requests failed with tunnel/network errors; init timed out, loaded remained false, actual Start still entered puzzle play and unavailable-services copy appeared. An additional unfiltered production browser test reported four uncaught SDK “Failed to fetch” errors. This failure is retained; it is not relabeled a passing SDK integration. Explicit network-denied shipping fallback and explicit QA stub tests are different evidence scopes. Actual hosted successful init/gameplay/ad/Inspector traces remain owner/platform work.

## 14. Advertisement lifecycle tests

Commercial opportunity exists only after completion, consumed by starting another puzzle; never on opening Gallery, initial play, active manipulation or menu browsing. Main blocks drag/pinch/pan/layout animation/overlap, preserves appropriate progress, owns pause/input and snapshots every bus mute before request. Board/camera/sorting are pausable; root maintains UI/bridge processing and blocks accepted input while paused. No fake ad-timeout resume: SDK must settle the Promise. Focus/manual pause and prior mute/pause ownership are restored rather than unconditionally unmuting/unpausing.

Explicit QA browser held-ad, overlapping request, pre-muted bus, busy-drag/layout, rejection, no-fill, failed-init and missing-SDK scenarios pass. Completion/history/next-game handoff and durable reload pass. No-fill invokes no onStart and records only resolved; rejection records rejected. No rewardedBreak, custom frequency timer, AdMob or native monetization SDK is introduced. Unknown never-settling SDK requests intentionally retain the input lock pending authoritative settlement; real-platform behavior remains an acceptance gate.

## 15. Browser QA

Scoped actual exports passed these coverage groups: five viewport phase (84 assertions before a later harness wait failure), all-35-content/difficulty phase (127 assertions before a later callback wait failure), and corrected focused save/ad/storage phase (32 assertions, complete pass). These are **separate phases**, not a falsely claimed single complete default-suite run. Final CI invokes the entire corrected suite; hosted result must be observed separately.

Viewports: 390×844, 844×390, 1365×768, 768×1024, 1024×768. Verified featured actionable setup, exact Classic12, actual mouse/touch drag, portrait two-finger pinch/pan, single/joined real Rail storage, shared shadow/thickness/face/EdgeRelief with correct z, repeated 286-piece switches, picture reference, More/Pause/continue, all 35 actual search/card/menu/Start selections, real drag-to-target snapping, native-aspect 40/150/286, save/reload, history/completion/next, bounded textures and hidden app-only surfaces. Completion/join fixtures alone invoke accepted board machinery; touch/drag/menu/navigation use actual rendered input. Screenshots were inspected, including production failure copy and featured flow.

Same-origin Full↔Poki namespace and real 1031×580 iframe checks: 12 pass; actual focus loss stops lifecycle/pauses input/mutes, focus regain restores ownership, wheel/arrows do not scroll host. SDK unit also covers visibility-change deduplication. Physical hidden/foreground mobile browser interruption and cross-site Safari storage remain unverified.

Nine shipping-export fallback checks pass with the official SDK request **explicitly denied**, no success stub: no QA callbacks/private logs, failed SDK remains failed at usable screen, portrait/landscape/reload, loaded offline tab, honestly unsupported offline reload, denied IndexedDB, visible missing-PCK failure and no uncaught application errors in that denied-SDK scope. This is separate from the failed unfiltered live-SDK run (four downstream “Failed to fetch” page errors).

Harness corrections retained in evidence: Godot canvas text needs typed key events rather than DOM insertText; wait for final Gallery/setup state, exact Start/Choose-next labels and post-reload callback installation; poll actual IndexedDB commit instead of assuming a 1.5–1.8s sleep persisted data. Initial apparent Full/Poki reload failures disappeared after the actual durable-commit condition and Full-only control. No accepted test assertions were weakened. Detailed scoped checks/traces: `browser-qa.json`, `sdk-browser-traces.json`, `production-fallback.json`.

## 16. Full-App regression results

| Existing suite / artifact | Observed result |
| --- | --- |
| Full native accepted list + release guard | **36/36 PASS**; geometry, shadows/EdgeRelief, snaps/merge/z, touch, saves, identity, UI, lifecycle, release flags. |
| Catalog texture lifecycle headless | PASS (additional suite). |
| Python `*_smoke.py` discovery | **50 PASS** (34 catalog/pipeline +7 release +4 packaging +5 Poki); separate content ingestion smoke PASS. |
| Repository release config/secret/content checks | PASS. |
| New bridge JS | **7/7 PASS**. |
| Poki native profile | PASS; four tiers/exact12, shared layers, unavailable-slot bytes/index preservation, bootstrap/resume interruption save guard, pause/prior mute. |
| Accepted Full browser journey | **38 assertions / 54 screenshots PASS**, including photos/trays/settings/replay/history/real snaps/persistence. |
| Accepted Full Rail transition matrix | **32/32 PASS**, 40/286 portrait+landscape, single/joined/repeated, real post-transition drag; unchanged assertions. Initial competing-browser callback timeouts rerun alone. |
| Old export → current ordinary Full-App PCK | PASS: museum + imported photo slots restore exact hash/geometry/discrete state; normalized position drift ≤1.38e-7 (existing tolerance1e-6); 38 old hashes unchanged; completed history unchanged. |
| Actual ordinary production Web export | PASS: raw55,667,593/PCK15,816,400/WASM39,514,754; 38 canonical originals, zero raw duplication, notices, no QA/Poki assets. |
| Ordinary production Web failure/flags browser | **4 checks PASS**: portrait/landscape/reload, logging/callback absence, denied storage, visible asset failure, live-tab offline and unsupported offline reload. |
| Unsigned Android base release export | PASS **39,047,884-byte APK**; com.piecepace.puzzles, min24/target36, arm64, debuggable=false/allowBackup=false, 16KB ELF/ZIP alignment, 38 unchanged identities/8 notices/no Poki resources. No signing/device/AAB revalidation claimed in this task. |
| Same shared payload comparison | **376/384 common PCK payloads byte-identical** by directory MD5; only catalog/identity/inventory/project/generated cache and plain fallback change. Shared scripts, shaders, classic cuts, fonts and museum imports unchanged. |

Full native logs contain 58 warnings and nine ERROR lines: three intentional corrupt-JSON cases plus six pre-existing watercolor shutdown resource/font/texture errors. No SCRIPT ERROR. Additional Poki native exit has the known CanvasItem/ObjectDB teardown warnings; those are not concealed or counted as a runtime leak-free certification. Tests validate behavior; shutdown ownership and real runtime pressure remain investigation items.

No changes to shared renderer, cut JSON, original JPGs/thumbnail imports, snap/merge, native touch, ordinary project identity or save schemas. Source diff from main outside added files is only `poki/*` exclusion in three ordinary presets. Hosted CI has not yet been observed; local passes must not be described as a successful GitHub run. Machine evidence is in `poki-rc1-evidence/` (no large videos/private photos/artifact binaries committed).

## 17. Poki Inspector checklist

**MANUAL / UNVERIFIED.** `https://inspector.poki.dev/` and its public app source were reachable. The app uploads ZIPs to `https://inspector-api.poki.io/v0/builds` to create a hosted build. That is a hosted upload, outside this assignment's authorization to submit/publish. No ZIP was uploaded and no Inspector pass asserted.

| Check | Status |
| --- | --- |
| Root index.html, relative local assets, no extra wrapping directory | PASS (local ZIP inspection) |
| Official SDK URL, bridge, source provenance, SHA256 manifest | PASS (local package inspection); successful hosted SDK still UNVERIFIED |
| 35 distinct approved original identities, thumbnails, notices | PASS (offline + dated live provider evidence) |
| Production QA callbacks/stub/private credentials absent | PASS (pack inspection + shipping fallback browser); limited check, not security certification |
| Deterministic content selection/hashes, sorted fixed-timestamp ZIP entries | PASS; not a claim that Godot-generated UID/cache ordering guarantees byte-identical PCKs across machines |
| Inspector hosted checklist, actual events/commercial behavior | MANUAL / UNVERIFIED |
| Static + animated platform game thumbnail, moderation, account/terms | OWNER / PLATFORM |

## 18. Outstanding blockers

1. **Delivery/startup:** misses raw project preference and verified 5MB/8MB article guidance. Actual Poki compression/CDN/cache behavior and target-device startup must be measured before an engine/profile decision.
2. **SDK/platform:** successful live hosted init/loading/gameplay/commercial/visibility ordering and Inspector not certified; cloud downstream errors are documented.
3. **Physical devices:** Safari/iPhone/iPad, Android browser, tablet safe areas, touch/zoom at high counts, GPU/context loss, thermal/low-memory background recovery and real FPS/peak memory remain manual. Chromium emulation is not Safari certification.
4. **Owner/legal/platform:** root code/icon/shader rights, final notices/privacy responsibilities for official SDK, content safety review, genuine account/game setup and static/animated game thumbnails. No privacy/legal policy invented.
5. **Embedded sizes/accessibility:** actual small 640×360/836×470 and cross-site third-party Safari storage/partitioning, broader keyboard/screen-reader canvas usability and localization need review. Same-origin iframe isolation does not prove cross-site storage policy behavior.
6. **Hosted CI:** workflow is added with read-only permission/artifact upload and no deployment. Only observed run results may be called green; local results below are separate.

No business/credential work, submission or publication is disguised as completed. No replacement of Pages, no merge, no public preview URL.

## 19. Reproducible build commands

Use repository's pinned Godot 4.7.2 release editor/templates and Python catalog requirements, Node/Playwright 1.55.0. Ordinary full-App exports continue using root presets.

```sh
python3 -m pip install -r tools/catalog_pipeline_requirements.txt
python3 tools/release/install_godot.py
export GODOT_BIN="$PWD/.godot-ci/Godot_v4.7.2-stable_linux.x86_64"
python3 tests/poki_catalog_smoke.py
node --test tests/poki_sdk_bridge_smoke.mjs
python3 tools/release/check_repository.py
python3 tools/poki/build.py --output build/poki-rc1/reproduced
python3 tools/poki/build.py --output build/poki-rc1/reproduced --qa
python3 tools/poki/inventory.py --pack build/poki-rc1/reproduced/production/index.pck --stage build/poki-rc1/reproduced/project-production --output build/poki-inventory.json
```

Build production **then** QA, never in parallel. ZIP is `build/poki-rc1/reproduced/PIECEFUL_POKI_RC1.zip`; large outputs are ignored. Export into a fresh owned directory; unexpected files cause refusal. Each artifact records its actual source SHA/dirty flag/engine; hashes cover every delivery file except the hash manifest itself. Sorted ZIP ordering, fixed timestamps and frozen assets/metadata make packaging inspectable; compare unpacked content/hashes rather than promise cross-machine Godot cache bytes.

```sh
npm install --no-save --package-lock=false playwright@1.55.0
npx playwright install --with-deps chromium
mkdir -p build/poki-http
ln -s "$PWD/build/poki-rc1/reproduced/production" build/poki-http/poki
ln -s "$PWD/build/poki-rc1/reproduced/qa" build/poki-http/qa
python3 tools/poki/serve.py --root build/poki-http
# Wait for "Benchmark only" / successful HTTP GET, then use another shell:
node tests/poki_browser_smoke.mjs
node tests/poki_production_browser_smoke.mjs
```

Server is loopback-only, an instrumentation tool, not public deployment. It precompresses before listening; restart after changing exports/symlinks, otherwise gzip data would be stale. For companion tests also symlink independently exported `full-qa`, `full-production`, `baseline` and prior `perf-before-qa` fixtures. Browser scripts accept `PIECEFUL_CHROMIUM_EXECUTABLE`, `PIECEFUL_POKI_ORIGIN`, report paths; use `PLAYWRIGHT_BROWSERS_PATH` for installed ffmpeg/video. Native profile smoke needs a fresh XDG data directory and staged `project-qa`, not root main.

Performance: `node tests/poki_performance_probe.mjs` runs three trials per delivery/profile, cold/warm and isolated runtime counters. Namespace: `node tests/poki_namespace_browser_smoke.mjs`. Same-art Full runtime control: `node tests/poki_baseline_runtime_probe.mjs`. Existing Full-App native runner: `python3 tools/release/run_native_regressions.py`; ordinary Web: `python3 tools/release/export_web.py`; Android: `python3 tools/release/export_android_validation.py` with actual installed JDK/Android SDK. No fake signing credential.

## 20. Recommendation: NO-GO

Keep the isolated profile and high-confidence cache/identity/SDK safety changes for review; they do not redesign accepted gameplay. **Do not submit or publicly launch RC1 yet.** Complete owner rights/content/platform setup, measure a compressed hosted candidate on actual devices, validate official SDK in the authorized platform and run Inspector. Then decide with Poki whether stock Godot delivery is acceptable or a carefully validated smaller template/local pack architecture is warranted. Preserve full-App native/offline behavior throughout. Only after those gates pass should Eddy approve a private platform test, followed by formal acceptance and any separate merge/release decision.
