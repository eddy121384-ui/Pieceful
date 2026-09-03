# Piecepace V0-01 Handoff：Classic Die-Cut Pipeline

日期：2026-09-01

## 一句話狀態

Piecepace 的 Godot 2D 核心 playable prototype 已經在 Windows / Godot 實機跑通：12 片可拖曳、Snap、完成、Reshuffle。接下來不要再把「每一塊拼圖片」當成 runtime 隨機生成物，而要改成：

> **Procedural Authoring Tool → Curated Reusable Die-Cut Library → Runtime Rendering**

也就是模擬實體拼圖工廠：先做一整張可重複使用的虛擬刀模，再把不同圖片套上去。

---

## 目前已驗證

### Godot 核心流程

已跑通：

- Godot 2D project 可正常啟動。
- 內建 demo image 可正常 import / render。
- 4 × 3 = 12 pieces。
- Polygon2D + UV 可把同一張 source image 映射到各 piece。
- Mouse drag 可用。
- piece 被拖起時可提高 z-order。
- 放到 target 附近會 Snap。
- 已 Snap piece 鎖定。
- 0 / 12 → 12 / 12 progress 正常。
- Completion panel 正常。
- Reshuffle / Play Again 正常。

因此以下問題已經不是風險：

> Godot 能不能做 Piecepace？

答案是：可以。

---

## 已發現並修正的第一個 runtime 問題

Godot 4.6 對 `min()` 配合 `:=` 的型別推斷會報 Parser Error：

```gdscript
var amplitude := min(piece_size.x, piece_size.y) * 0.20
```

已改成明確 float / `minf()`。

這類型問題之後應優先使用 Godot typed variants（`minf`, `maxf`, `clampf` 等）避免推斷雷。

---

## 第一代 piece geometry：失敗但保留學習

第一版把每塊 piece 當成矩形，四邊用簡單折線 tab / slot。

結果：

- 可玩，但 silhouette 很像 prototype。
- tab / slot 是折線，不像真正 die-cut。
- piece 太規則、太像電腦生成。

這版只證明 Polygon2D / UV / Collision / Drag / Snap pipeline 可行。

---

## 第二代 shared cut generator：方向正確、造型失敗

新增 `scripts/cut_pattern_generator.gd`，第一次把思路改成：

- 先建立整張 grid intersections。
- internal edge 只生成一次。
- 相鄰兩片共用同一條 cut segment。
- piece 只是取 top / right / bottom / left 四條共享切線組成 outline。
- 加入交點 jitter、tab center / width / depth / asymmetry 等變異。

這個 **data architecture 是對的**。

但是第一版 geometry 視覺非常差：

- tab 像鑰匙孔。
- neck 太細。
- head 過大。
- depth 過深。
- variation 過強。
- 格點 jitter 太大。
- 整體不像 classic jigsaw，而像亂數異形拼圖。

這個版本不要繼續靠微調參數救。

重要結論：

> **「每一片都不同」不等於「每一條邊都大幅 random」。**

實體 classic jigsaw 的語法其實很強：piece 都屬於同一家族，只在中心、寬度、深度、曲率、微小不對稱上有變化。

---

## 關鍵產品 / 技術結論：模擬「刀模」，不要生成「片」

實體量產拼圖不是 1000 個獨立模具，而是一整張 die sheet：

```text
Printed image + board
        ↓
Reusable steel die-cut pattern
        ↓
One press
        ↓
500 / 1000 pieces
```

所以數位版本也應該是：

```text
CutPattern / DiePattern
        ↓
shared horizontal cuts
shared vertical cuts
        ↓
closed outline per piece
        ↓
apply source-image UV
```

每條 internal edge 只存在一次。

例如 A 的右邊與 B 的左邊不是兩條「很像」的線，而是同一條 cut 的正反向使用。

---

## 新的正式架構決策

### 不建議

```text
玩家開始一局
↓
Runtime RandomNumberGenerator
↓
現場生一整副刀模
↓
希望這副好看
```

理由：

- 品質不可控。
- 玩家可能抽到醜刀模。
- 1000-piece geometry QA 困難。
- Runtime 計算沒有必要。
- 不利於人工視覺審核。

### 建議

```text
Development / Authoring time

Procedural Die Generator
        ↓
Generate many candidates
        ↓
Automatic validation
        ↓
Visual preview / human curation
        ↓
Save approved CutPattern asset

--------------------------------

Runtime

image_id + cut_pattern_id
        ↓
load approved cut pattern
        ↓
apply source-image UV
        ↓
play
```

核心原則：

> **Procedurally generate reusable virtual die-cuts, not every puzzle at runtime.**

---

## 建議的 CutPattern Library

未來可以有：

```text
Classic_036_A
Classic_036_B
Classic_100_A
Classic_100_B
Classic_300_A
Classic_300_B
Classic_500_A
Classic_1000_A
```

V1 不需要很多。

每個常用 piece count 有 2–5 副漂亮、經過 QA 的 classic die 已經足夠。

不同圖片可以重用同一刀模，就像實體拼圖工廠會重複使用同一副 steel die。

---

## 建議的 CutPattern 資料模型

CutPattern asset 應至少包含：

```text
pattern_id
version
columns
rows
aspect_ratio_class
style = classic_ribbon

vertices / intersections
horizontal_segments
vertical_segments

(optional)
piece_signature
validation_metadata
```

每個 internal cut segment 應為 canonical data；piece 不儲存自己的獨立邊。

Piece outline 在 runtime 由共享 segment 組合：

```text
top    = H[row][col]
right  = V[row][col + 1]
bottom = reverse(H[row + 1][col])
left   = reverse(V[row][col])
```

---

## Classic Ribbon Cut 的視覺規格

參考目標是傳統紙板拼圖，而不是 random-cut 木拼圖。

### 必須保留

- 外框 flat edge。
- 整體仍能看出 row / column ribbon structure。
- internal baseline 可輕微彎曲 / 斜，但幅度小。
- intersection 可小幅偏移，但不能讓主體變形太大。
- tabs / blanks 為柔和 S-curve。
- neck 不可過窄。
- head 不可像蘑菇 / 鑰匙孔。
- depth 應比上一版淺。
- tab center 可偏左 / 偏右，但仍大致位於 edge 中央區。
- 每條 edge 可有 controlled variation。
- 每片 silhouette 應自然不同，但仍屬於同一 die-cut family。

### 禁止

- extreme random jitter。
- keyhole tabs。
- overly thin necks。
- very deep tabs。
- sharp spikes。
- self-intersections。
- edge overshoot 撞到 neighboring corner / adjacent tab。
- 為了 uniqueness 破壞 classic jigsaw 語法。

---

## Authoring Tool 要做什麼

第一版不需要做華麗 Editor plugin；先做 developer tool 即可。

建議功能：

1. 指定 `columns × rows`。
2. 指定 seed。
3. 生成完整 CutPattern candidate。
4. 顯示一張「只有黑色刀線、白底」的 preview。
5. 可以切換 seed / Generate Next。
6. 自動檢查：
   - segment self-intersection
   - piece self-intersection
   - minimum neck width
   - maximum depth
   - minimum distance from corner
   - neighbor shared-edge consistency
   - invalid / degenerate polygons
7. 未來可加 silhouette similarity score，但 V0 不必過早複雜化。
8. 按 Approve 後輸出 deterministic asset（JSON 或 Godot Resource）。

第一版優先使用人眼挑刀模，不需要先打造一個過度聰明的 uniqueness optimizer。

---

## Runtime 要變簡單

正式 runtime 不負責創作刀模。

它只需要：

```text
load image
load CutPattern asset
build Piece polygon
map UV
spawn / scatter
play
```

這有幾個好處：

- 品質穩定。
- 效能可預測。
- 刀模可人工 QA。
- Save / Resume 更簡單。
- 不同 image 可重用 cut pattern。
- future content pipeline 不需要為每張圖片人工切 pieces。

---

## Save / Resume 對應

之後 #3 可以只保存：

```text
image_id
cut_pattern_id
piece_count
puzzle_instance_state
```

而不用保存整副 polygon geometry。

如果 CutPattern asset 有版本：

```text
cut_pattern_id
cut_pattern_version
```

即可確保舊 save 在 generator 更新後仍使用原本刀模。

---

## 下一個實作任務

### Step 1：停止把目前 runtime generator 當 final architecture

現有 `CutPatternGenerator` 可當演算法實驗場，但不要把「每局 runtime random generation」視為正式設計。

### Step 2：建立 CutPattern asset schema

優先選一種：

- Godot `Resource`（較原生）；或
- JSON（容易檢查 / diff / 生成）。

V0 建議 JSON，因為人類可讀、Git diff 清楚、之後 authoring tool 容易寫。

### Step 3：建立 authoring / preview mode

先做 4 × 3 或 6 × 6，能快速生成不同 seed 的 die-only preview。

不要一開始碰 1000 pieces。

### Step 4：把 classic tab template 做對

先做一個非常像實體傳統拼圖的標準 edge profile。

再只加 small controlled variation。

### Step 5：人工挑選第一副 approved die

例如：

```text
Classic_012_A.json
```

把它套回現有 playable prototype。

成功判準不是「數學上很複雜」，而是：

> **玩家第一眼會說：這就是傳統拼圖。**

### Step 6：再擴到 36 / 100 / 300 pieces

等第一副 12-piece 或 36-piece classic die 看起來對，再進 #2 的 difficulty / Zoom / Pan / responsive workspace。

---

## 不要現在做

- Random Cut / whimsy pieces。
- 木拼圖 irregular cuts。
- 3D piece thickness。
- 1000 rigid bodies。
- AI / ML shape generation。
- runtime generated unique die per session。
- fancy authoring UI。
- 大型 silhouette uniqueness solver。

這些都不是目前 Gate。

---

## PR / Branch 狀態

目前工作 branch：

```text
feat/v0-01-godot-core-jigsaw
```

Draft PR：

```text
#16 V0-01: Godot 2D core jigsaw vertical slice
```

PR 暫時不要 merge。

理由：核心 gameplay 已跑通，但 piece geometry / cut-pattern pipeline 正在進行根本性調整。

---

## 下一個 Gate

V0-01 不必等到所有正式功能完成，但在 merge 前至少要達成：

- playable loop 仍然穩定；
- 刀模 architecture 採 shared cuts；
- 至少一副 curated classic die asset；
- 12-piece demo 第一眼像傳統拼圖，而不是程序生成異形塊；
- 同一 CutPattern 可套不同 image；
- Runtime 不依賴每局 random generator 才能建立 puzzle。

通過後才真正把 #1 視為完成，進 #2。

---

## Product Principle

> **We do not generate pieces. We design a virtual die that cuts pieces.**

中文：

> **我們不是在生成 1000 塊拼圖片；我們是在做一副能切出 1000 塊拼圖片的虛擬刀模。**

這是接下來 Piecepace 拼圖幾何系統的核心 mental model。
