# Piecepace: Jigsaw Puzzles

> **Piece at your own pace.**

Piecepace 是一款以「安靜、舒服的數位拼圖工作台、玩家自己的整理方式」為核心的傳統 Jigsaw Puzzle。

> **No ads while you puzzle.**

目前正式進入 **V0 / playable prototype** 階段。

## V0-01：Godot Core Vertical Slice

目前開發分支：

`feat/v0-01-godot-core-jigsaw`

第一個垂直切片刻意很小，只驗證核心技術：

- Godot 2D 專案可直接執行；
- 一張內建測試圖；
- 固定 4 × 3，共 12 片；
- 程序生成互相匹配的 jigsaw tabs / slots；
- 同一張原圖透過 Polygon2D UV 映射到每一片；
- 拖曳；
- 靠近正確位置自動 Snap；
- 進度計數；
- 12 / 12 後 Completion；
- Reshuffle / Play again。

這一版**故意不做** Zoom / Pan、Sorting Tray、Loose Pile、Save、Gallery、Puzzle Me、推薦、廣告或美術 Polish；它們有各自的後續 Issues。

## 如何在本機跑

### 需求

- Godot 4.x（建議目前穩定版）；
- 不需要額外 plugin；
- 不需要 Node.js / Python / 後端。

### 啟動

1. Clone repo：

   ```bash
   git clone https://github.com/eddy121384-ui/Pieceful.git
   cd Pieceful
   ```

2. 切到目前開發分支：

   ```bash
   git switch feat/v0-01-godot-core-jigsaw
   ```

3. 用 Godot 的 **Import** / **Open Project** 選擇 repo 根目錄的 `project.godot`。
4. Godot 完成首次 SVG / script import 後，按右上角 **▶ Run Project**（F6/F5 皆可依 editor 選項）。
5. 把左右兩側的拼圖片拖到中央淡淡的完整圖位置；靠近正確位置會吸附。

### 如果開不起來

請把 Godot 下方 **Debugger / Errors** 的第一個紅色錯誤完整貼回來；不要先自行重寫專案。V0-01 的目標就是把第一條本機執行路徑修到穩定。

## 目前產品方向

- **Quiet**：拼圖進行中不強制插播廣告、不用高壓遊戲化打斷 Flow；
- **Workspace**：目標不是只有「把圖拼起來」，而是打造真正適合數位拼圖的工作台；
- **Chaos → Order**：後續驗證 Loose Pile、Sorting Table 與玩家自定義 Trays；
- **Portrait / Landscape**：直式與橫式都是正式遊玩方式；
- **Puzzle Me**：把本機照片變成拼圖；
- **Discovery**：Search / Filter / Tags，再逐步加入 local-first 個人化推薦；
- **Gentle Progression**：Puzzle Journal 記錄真實玩過的時間與作品，不製造假健康分數；
- **Local-first**：優先不需要帳號、不上傳私人照片、不依賴後端；
- 一次性 **Remove Ads** 作為主要付費方向之一；
- 目標是一人公司可長期維護的 evergreen cash-flow game，而不是 Live Service。

## 文件

- [產品方向（中文）](docs/PRODUCT_DIRECTION_ZH.md)
- [市場與競品分析（中文）](docs/MARKET_AND_COMPETITORS_ZH.md)
- [工作台與大拼圖 UX 需求（中文）](docs/WORKSPACE_REQUIREMENTS_ZH.md)

## V1 明確暫緩

V1 不做 PvP、排行榜、帳號社群、雲端同步、故事模式、3D 博物館、3D 拼圖盒、1000 個 rigid bodies、Battle Pass、體力、抽卡、Runtime AI 與高維護 Live Ops。
