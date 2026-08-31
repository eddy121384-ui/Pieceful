# Piecepace V0-01 實作備註

## 這一版驗證什麼

V0-01 只回答一個問題：Godot 2D 是否能用乾淨、可擴充的資料模型做出一張真正可拖、可 snap、可完成的傳統拼圖。

## 結構

- `PuzzleDefinition`：保存 grid、board rect、source cell 尺寸，以及 deterministic tab / slot 邊資料。
- `PuzzlePiece`：一片可互動拼圖片；使用 `Polygon2D` 顯示、`CollisionPolygon2D` hit area、滑鼠 / touch 拖曳。
- `PuzzleBoard`：建立整局、產生 pieces、scatter、snap 判定與 completion。
- `Main`：只負責最小 UI 與重開一局，不把拼圖規則寫進 UI。

## 為什麼不是矩形灰盒

這一版直接生成凹凸 jigsaw outline。相鄰內邊由同一個 deterministic edge definition 成對建立：一側 tab，另一側必為 slot。

每個 piece 都引用同一張 source texture，以其 polygon vertices 對應 source-image UV；因此不需要事先輸出 12 張獨立圖片資產。

## 刻意保留到後續 Issue

- #2：Zoom / Pan、36 / 100 / 300 pieces、Portrait / Landscape、手感。
- #14：Sorting Trays、Piece Library、multi-select、Sorting Table。
- #15：Loose Pile、Spread、Chaos → Order、大量 pieces 效能。
- #3：Save / Resume。

目前固定 4 × 3 / 12 pieces 是刻意的，不是正式難度設計。

## 尚待真機確認

目前 repo 端已完成 source-level review，但仍需要在實際 Godot editor / Windows 或 mobile runtime 確認：

1. SVG 首次 import。
2. Polygon2D UV 在目標 Godot 版本上的實際貼圖結果。
3. CollisionPolygon2D 對凹形 tab / slot 的拾取手感。
4. Mouse / touch drag event flow。

因此 PR 在真機 smoke test 前應維持 Draft，不 merge。
