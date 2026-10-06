# Final product QA cleanup — 2026-10-02

Branch: `spike/codex61-commercial-product-ux-pass`. Starting build: `a4e10a1f26c3618f67adae725d6f1559f9c1b5b8`.

Two confirmed issues were found and fixed. With Pieces in rail mode, switching back to an unfinished puzzle could restore the correct progress count while leaving its solved pieces hidden. The board rebuild had stashed the new piece nodes before saved solved state was applied. A cold reload displayed them correctly, which explained why progress-only reload checks missed the warm-switch defect.

The visibility fix sets `piece.visible = true` when restoring a solved piece in `single_slot_save_coordinator.gd`. The existing native multi-slot test now reproduces a rail-mode switch and asserts visibility and exact target position. The Web journey checks solved-piece visibility both when switching unfinished slots and when returning from completion.

Before: [progress restored, board visually empty](final-qa-evidence/resume-before.png). After: [solved pieces visible after completion-to-resume](final-qa-evidence/resumed-after-completion.png).

The second issue appeared when returning to the newer unfinished puzzle: its slot could contain the original puzzle's artwork instead. Autosave (or lifecycle flush) could run during the asynchronous content/board restore, while the old slot was still active. `multi_slot_save_coordinator.gd` now blocks snapshot writes throughout a manual resume and its rollback, while preserving the current puzzle before the transition begins. It also rejects overlapping resume requests. The native test forces both timer autosave and lifecycle flush during a board rebuild, verifies the other slot's artwork identity is unchanged, then resumes that slot and checks its picture/progress. The extended Web journey asserts both pictures and progress during the round trip. [Correct restored original](final-qa-evidence/original-resumed.png). [Failure evidence](final-qa-evidence/identity-before.png).

No other confirmed open product issue was found in this pass. Screenshots were captured from fresh Web sessions during this audit; previous audit screenshots were not used as evidence for the finding.

| Step | Runtime journey and observed result |
| --- | --- |
| 1 | Fresh launch opens Browse; picture and piece count lead to Start. |
| 2 | Real mouse input drags a loose piece and snaps three pieces into their actual targets. [Evidence](final-qa-evidence/three-real-snaps.png). |
| 3 | Gallery preserves progress; a reload after an actual IndexedDB commit restores the same game and exact three solved pieces. |
| 4 | Picture cycles through floating reference, board reference and hidden; Hint toggles; Pieces opens the rail; More opens and dismisses. |
| 5 | Trays creates one named tray, renames it, collapses/expands it, and stores a piece through a real drag into its rendered row. The playable tray shows that piece. [Evidence](final-qa-evidence/playable-tray.png). |
| 6 | Search, theme, For You, In progress and New filters reflect the current content/state. Favorites and My photos are reachable. |
| 7 | The HTML file picker imports a photo setup candidate; cancel returns to Gallery without changing the active puzzle or progress. |
| 8 | Settings and empty History open and dismiss. Unsupported Web purchases remain hidden. [Narrow Settings](final-qa-evidence/narrow-settings.png). |
| 9 | A second puzzle receives a separate slot. The unfinished list switches to the original puzzle and back with exact progress. Active deletion remains disabled. |
| 10 | Board Lines ON displays the accepted overlay; OFF removes it. Both narrow portrait and short landscape are checked. Fit remains reachable. [Narrow ON](final-qa-evidence/narrow-lines-on.png). |
| 11 | Piece-count change and Reshuffle show consequence-aware confirmations; cancel preserves the same puzzle and progress. |
| 12 | Completion opens Share, which downloads a valid PNG through the actual Web fallback; Replay opens/closes; Choose next returns to Gallery; History contains the completion. [Evidence](final-qa-evidence/share-result.png). |
| 13 | Another unfinished puzzle resumes immediately after completion with its solved pieces visible. Reload preserves its progress and tray, the completed slot remains retired, and History remains stored. |
| 14 | Responsive review covers 390×844, 320×568 and 844×390, including portrait → landscape → portrait. Trays, popup positioning, confirmation layering, Gallery scrolling and fixed sheet actions remain usable. [Narrow tray](final-qa-evidence/narrow-expanded-tray.png), [short landscape popup](final-qa-evidence/short-popup.png). |

Completion is reached with the QA scene's deterministic solved-cluster fixture; the first three snaps and tray movement use real pointer input. UI navigation always uses rendered control bounds. The separate QA bridge is absent from the production main scene.

The full native regression suite passed 35/35 after both fixes. The final Web run passed 38 journey assertions and captured 54 screenshots with no runtime errors. Validation results are recorded in [native-results.json](final-qa-evidence/native-results.json) and [browser-results.json](final-qa-evidence/browser-results.json). The full native suite covers product navigation, watercolor/reachable UI, Gallery and selection, save/resume robustness, photo flow, History, completion/share, replay/video export, touch arbitration, pinch handoff/recovery, piece depth and overlap z-order. Production Web readiness is checked separately at DPR 3, with no QA bridge or browser console/page errors. The same-branch deployment workflow reruns its required native tests and the expanded Web flow, then verifies the published branch and exact commit SHA.

Deliberately unchanged: the accepted watercolor palette, Gallery/Start/Continue structure, HUD and More hierarchy, Trays/Pieces/Picture/Hint presentation, Board Lines, completion and History/Settings organization. Renderer, relief, thickness, shadows, geometry, gesture arbitration, pinch/camera behavior, drag thresholds, hit padding, overlap ordering, snap/merge logic and save schema are unchanged.

This pass supports proceeding to final physical iPhone QA and merge consideration. It does not certify iPhone Safari: actual Safari safe areas, virtual-keyboard behavior, touch comfort and the native Share sheet still require the physical-device check. The user's prior physical iPhone acceptance of Board Lines is preserved. No merge was performed.
