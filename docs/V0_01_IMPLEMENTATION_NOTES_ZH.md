# Piecepace V0-01 實作備註

## 這一版驗證什麼

V0-01 只回答一個問題：Godot 2D 是否能用乾淨、可擴充的資料模型做出一張真正可拖、可 snap、可完成的傳統拼圖。

第一輪真機 smoke test 已證明 core loop 可執行；接著把原先粗糙的規則 tab / slot 升級為 **Procedural Classic Die-Cut Generator**，避免把假的拼圖片輪廓一路帶進後續難度與 Sorting 架構。

## 結構

- `CutPatternGenerator`：先生成整張共享刀模，而不是讓每塊 piece 各自亂生四條邊。
  - 建立略微偏移的 grid intersections。
  - 生成 horizontal / vertical shared cut segments。
  - 每條內部 cut 有獨立 tab center、neck、head、depth、asymmetry 與 baseline bend。
  - 同一 cut segment 被左右或上下兩塊 piece 反向共用，因此凸凹輪廓天然 100% 相同。
- `PuzzleDefinition`：保存 grid / board rect / source cell 尺寸，並持有 deterministic cut pattern。
- `PuzzlePiece`：一片可互動拼圖片；直接接收由共享刀模組成的 closed polygon，使用 `Polygon2D` 顯示、`CollisionPolygon2D` hit area、滑鼠 / touch 拖曳。
- `PuzzleBoard`：建立整局、產生 pieces、scatter、snap 判定與 completion。
- `Main`：只負責最小 UI 與重開一局，不把拼圖規則寫進 UI。

## 為什麼改成「先生成刀模」

真實傳統拼圖不是「每塊矩形各自掛四個一樣的凸榫」。它比較像一整張紙板被同一套刀模切開：

1. 相鄰 piece 的邊界其實是同一條實體 cut。
2. 交點不一定落在完美等距矩形格點。
3. tab 的中心、胖瘦、脖子、圓頭、深度與左右對稱程度都會有變化。
4. 每塊 piece 的 silhouette 因四條共享 cut 的組合而自然不同。

因此目前資料流是：

`seed → CutPatternGenerator → shared cut segments → Piece outline → Polygon2D / UV`

而不是：

`piece → random top/right/bottom/left`。

## Classic Die-Cut 幾何

每條內部 cut 由一組 smooth Catmull-Rom sampled anchors 生成。輪廓刻意包含：

- narrow neck；
- rounded overhanging head；
- variable tab center；
- variable head / neck width；
- variable depth；
- small left/right asymmetry；
- subtle baseline bend；
- slight shared-grid intersection jitter。

外框仍維持矩形平邊。

同一個 seed 會重建相同刀模，因此未來 Save / Resume 可以保存 `seed + difficulty + generator version`，不必保存整批 polygon vertices。

## UV

每個 piece 仍引用同一張 source texture。piece polygon 可以超出 nominal cell rectangle，但 UV 依 board-space 對應 source image，因此 tab 凸出去的區域仍取得原圖正確位置的 pixels，不需要事先切出大量獨立圖片資產。

## 刻意保留到後續 Issue

- #2：Zoom / Pan、36 / 100 / 300 pieces、Portrait / Landscape、手感。
- #14：Sorting Trays、Piece Library、multi-select、Sorting Table。
- #15：Loose Pile、Spread、Chaos → Order、大量 pieces 效能。
- #3：Save / Resume。

目前固定 4 × 3 / 12 pieces 是刻意的：先把刀模 silhouette 驗證到「看起來真的像拼圖片」，再把同一 generator 放大到更多片數。

## 尚待真機確認

新版刀模需要在實際 Godot editor / Windows runtime 確認：

1. script parser 是否全部通過。
2. 12 塊 polygon 是否無 self-intersection / 尖刺 / 異常碎角。
3. 相鄰 shared cut 完成後是否完全重合。
4. Polygon2D UV 在凸凹與偏移交點處是否正確。
5. CollisionPolygon2D 對更複雜 concave silhouette 的拾取是否仍穩定。
6. Mouse / touch drag event flow 是否未被 geometry refactor 破壞。

因此 PR 在新版 die-cut 真機 smoke test 前繼續維持 Draft。
