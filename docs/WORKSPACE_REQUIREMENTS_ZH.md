# Pieceful 工作台與大拼圖 UX 需求（中文）

> 狀態：Product Requirements Draft  
> 更新：2026-08-31

## 1. 核心產品命題

Pieceful 不只模擬「把圖片拼起來」，而要更接近真實的 **puzzling**：

> **完整圖 → 混亂 → 搜尋 → 攤開 → 分類 → 局部成形 → 完整**

真正的大拼圖樂趣不只是 snap，而是玩家親手把一團混亂逐步整理成秩序。

因此工作台的核心原則是：

> **Small screen, big table.**

手機螢幕雖小，但 UI 應讓玩家感覺自己擁有一張可以整理數百到上千片拼圖的大桌面。

---

## 2. 直式 / 橫式都是第一級遊玩模式

玩家應可依情境自由使用 **Portrait（直式）或 Landscape（橫式）**，而不是只有一種方向被視為正式體驗。

### 必要行為

- 同一局拼圖可在直式 / 橫式間切換，不得丟失進度、piece position、tray 狀態或 board 狀態。
- UI 必須 responsive，而不是把單一 layout 硬縮放。
- 玩家可跟隨裝置旋轉；後續可評估提供 Portrait / Landscape / Auto orientation lock。
- Puzzle Board、Piece Library、Sorting Tray 在不同方向可採不同配置。

### 建議布局

#### Portrait

- Puzzle Board 為主體。
- Piece Library / Sorting Trays 優先使用 bottom drawer / overlay drawer。
- 大量分類時可切換成全螢幕 Sorting Table。

#### Landscape

- Puzzle Board 可占左側 / 中央大部分空間。
- Piece Library / Sorting Trays 可利用右側 side panel。
- 不強迫使用與直式完全相同的 UI。

核心目標不是讓兩種方向看起來一致，而是讓兩種方向都舒服。

---

## 3. 小拼圖與大拼圖不應使用完全相同的整理需求

### 小型拼圖（約 36–100 pieces）

- 優先極簡。
- 不強迫分類。
- 可直接 scatter / simple tray。
- Sorting 系統不應成為額外操作負擔。

### 中型拼圖（約 100–300 pieces）

可逐步提供：

- Edge-only filter；
- Loose Pieces；
- 基本 Sorting Tray；
- 簡單 multi-select / move-to-tray。

### 大型拼圖（約 300–1000+ pieces）

需要真正的 workspace management：

- Piece Library；
- Sorting Table；
- 玩家自定義 Sorting Trays；
- Loose Pile；
- 多片選取；
- Board / Sort mode 切換；
- 大量 pieces 的效能與可讀性策略。

片數門檻不是固定產品規則，應由實際 UX 測試調整。

---

## 4. Sorting Tray：系統提供容器，玩家決定分類方法

Pieceful 不預設玩家應該如何分類。

不同玩家可能依：

- 邊片；
- 顏色；
- 天空 / 建築 / 人物；
- 左半 / 右半；
- 紋理；
- 自己看得懂的任意方式；
- `???` 暫存；

進行分類。

### Sorting Tray 必要能力

- 玩家自行新增 Tray。
- Tray 可不命名，預設 `Tray 1 / Tray 2 / ...`。
- 可自訂名稱。
- 可重新排序。
- 可收合 / 展開。
- 顯示目前 pieces 數量。
- 可把單片或多片移入 Tray。
- 可把 pieces 從 Tray 拉回 Board / Sorting Table。
- 刪除 Tray 時不得默默刪除其中 pieces；需安全回到 Loose Pieces 或由玩家選擇目的地。

### 可後續評估

- 自訂 icon / 顏色標記。
- Tray layout 自訂。
- 每局記住玩家的 workspace arrangement。

核心原則：

> **Pieceful 提供整理工具，但不替玩家決定秩序。**

---

## 5. Box / Chaos Experience：模擬「一盒拼圖」，不要做 3D 物理模擬器

實體拼圖開始時不是一排規整零件，而是一團混亂。

Pieceful 應研究把這段轉成數位玩法，但不需要 3D 盒子、真實 rigid-body physics 或大量專屬美術。

### 建議方向：2D / 2.5D 假物理

開局可以：

1. 顯示完整圖片；
2. 玩家開始；
3. 圖片視覺上裂成 pieces；
4. pieces 以 procedural tween / seeded layout 散成 Loose Pile；
5. 玩家開始自己攤開與分類。

這個 opening 可形成：

> **Order → Chaos**

整局則完成：

> **Chaos → Order**

### Loose Pile

- 視覺上可重疊、旋轉、凌亂。
- 不需要完整物理碰撞。
- piece 初始位置 / rotation / z-index 可由 deterministic seed 生成。
- 玩家可把 piece 拉出 pile。
- 可研究 swipe / spread gesture 讓一群 pieces 視覺上散開。
- 大型 puzzle 不一定要 1000 個 active physics objects 同時運作。

可以使用視覺 proxy / lazy activation / virtualization，讓畫面感覺是一大堆 pieces，但避免效能浪費。

### 不值得模擬的真實摩擦

預設不要強迫：

- 一片一片翻背面；
- pieces 掉到地上；
- 真實摩擦 / rigid body 抖動；
- 因桌面尺寸造成無謂阻塞。

目標是 **physical puzzle fantasy**，不是 physical inconvenience simulator。

---

## 6. Puzzle Board 與 Sorting Table

大拼圖可研究兩個主要工作空間：

### Puzzle Board

- 專注組裝。
- 盡量提供最大畫面。
- Sorting UI 可縮成 drawer / side panel。

### Sorting Table

- 專注整理 Loose Pieces 與 Trays。
- 可暫時縮小或隱藏 Board。
- 允許玩家一次處理較大量的 pieces。

玩家應能快速在 Board / Sort 間切換，狀態持續存在。

這比把 Board + 1000 pieces + trays + toolbar 全塞在 6 吋螢幕上更合理。

---

## 7. Multi-select / Box Select

大型 puzzle 需要一次處理多片的能力。

### 桌面端

可研究傳統 box select：拖出矩形範圍，一次選多片。

### 手機 / 平板

因單指拖曳已用於移動 piece，不應直接照搬桌面操作。

可研究：

- 長按進入 Multi-select mode；
- 點選多片；
- 長按空白處進入框選模式；
- 選取後一次 Move to Tray / Move to Board。

這是大拼圖效率工具，不需要在 36-piece puzzle 強迫顯示。

---

## 8. Smart Tools：幫玩家整理，不替玩家解題

可以提供：

- `Edges`：顯示 / 篩選邊片；
- `Loose Pieces`：尚未 snap / 尚未組上的 pieces；
- approximate color filter（後續研究）；
- similar visual filter（後續研究）。

但系統不應直接替玩家決定：

- `Sky Tray`；
- `Building Tray`；
- 正確所在區域；
- 自動完成分類；
- 直接指出 piece 正確位置。

分類與建立秩序本身就是拼圖玩法的一部分。

---

## 9. 工作台 UX 的產品原則

1. **Sorting is gameplay, not housekeeping.**
2. **小拼圖不需要大拼圖的管理負擔。**
3. **大拼圖的問題不是怎麼顯示 1000 片，而是怎麼舒服地管理 1000 片。**
4. **玩家自定義秩序，系統只提供工具。**
5. **直式與橫式都是真正的一級遊玩模式。**
6. **不要用 3D / 真物理換來不必要的美術與工程成本。**
7. **工作區應可被玩家習慣；成熟後不要隨意搬動 Tray / 核心操作。**

最終目標：

> **Most digital jigsaws simulate assembling a picture. Pieceful should simulate puzzling.**

也就是：

> **很多數位拼圖只模擬「把圖拼起來」；Pieceful 要模擬的是「做拼圖」這件事。**
