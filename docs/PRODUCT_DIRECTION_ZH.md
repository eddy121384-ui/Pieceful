# Pieceful 產品方向（中文）

> 狀態：Pre-production / Product Discovery  
> 最後整理：2026-08-31

## 1. 一句話定位

**Pieceful 是一款安靜、低壓、長期可陪伴玩家的數位拼圖遊戲：不在拼圖途中打斷玩家，讓玩家用自己的節奏完成漂亮的圖，並且逐漸學會玩家真正喜歡拼什麼。**

工作中的英文品牌句：

> **Pieceful — A quiet jigsaw puzzle that learns what you love.**

核心產品承諾：

> **No ads while you puzzle.**

中文名稱目前可暫以「拾光拼圖」作為工作名，但正式上架前仍需做 App Store / Google Play / 商標 / 網域撞名檢查。

---

## 2. 這個產品不是什麼

Pieceful 不是要做成：

- Candy Crush 式高壓 F2P；
- Live Service；
- 需要每週大量人工活動才能維持的內容遊戲；
- 有 PvP、排行榜、戰鬥通行證、體力、寶石、抽卡的遊戲；
- 需要帳號、雲端後端、即時多人伺服器才能成立的產品；
- 以「醫療、治療、預防失智、提升智商」作為銷售訴求的 Brain Training App；
- 為了看起來有內容而硬塞劇情、3D 展覽館、角色養成等系統的 scope-creep 專案。

本專案的商業目標更接近：

> **一人公司可以長期維護的 evergreen cash-flow game。**

核心判準：

> 若一個功能不能明顯改善 Acquisition、Retention 或 Monetization，卻會提高長期維護成本，原則上不做。

---

## 3. 目標玩家與使用情境

主要假說不是「拼圖只屬於老年人」，而是：

- 拼圖 / puzzle 類在女性玩家中通常比男性更受歡迎；
- 35+、45+、甚至 65+ 玩家對低壓、可隨時開始與停止、操作規則穩定的休閒遊戲具有長期需求；
- 很多玩家可能年輕時喜歡大型遊戲，但進入工作、家庭或退休階段後，實際遊玩行為會移往更容易塞進日常時間的遊戲；
- 玩家可能一邊拼圖，一邊聽 Podcast、Audiobook、Spotify 或看其他內容；
- 這類玩家未必追求「每天解鎖更多功能」，反而重視熟悉、可預測、不亂改 UI、不打斷。

典型使用情境：

- 睡前 20 分鐘；
- 通勤 / 等待；
- 午後休息；
- 一邊聽 Podcast 一邊拼；
- 假日長時間完成 200–500 片；
- 用自己的照片做成拼圖。

---

## 4. 核心 Loop

V1 的核心流程必須極度簡單：

1. Home
2. 選圖
3. 選難度 / 片數
4. 開始拼圖
5. 拖曳、縮放、平移、吸附（snap）
6. 自動保存進度
7. 完成
8. 顯示漂亮而低壓的完成紀錄
9. 在自然斷點才可能出現廣告
10. 下一張 / 回首頁

另一條完全相同的內容入口：

**Puzzle Me**

1. 匯入本機照片
2. 生成 PuzzleDefinition
3. 使用同一套拼圖引擎
4. 完成後可收藏在個人日誌

官方圖片與玩家圖片盡量共用：

> `Image → PuzzleDefinition → Puzzle Session`

避免維護兩套不同玩法。

---

## 5. V1 必須有的功能

### 核心拼圖體驗

- 多種片數 / 難度；
- 拖曳與穩定 snap；
- Zoom / Pan；
- 自動儲存與 Resume；
- 清楚的工作區；
- 基本 Hint；
- 可選是否旋轉拼圖片（V1 是否預設開啟待 UX 測試）；
- 完成畫面；
- 本機離線可玩。

### Puzzle Me

**必做。**

雖然競品早已有照片轉拼圖，但它屬於 table stakes：

- 從相簿選照片；
- 本機處理；
- 不要求上傳伺服器；
- 不要求帳號；
- 優先保護隱私與零後端成本。

### 基礎收藏 / 歷程

- 完成過的拼圖；
- 未完成拼圖；
- Favorites；
- 基本 Puzzle Journal。

---

## 6. 廣告原則：玩家用注意力支付，但我們不破壞 Flow

Pieceful 不假設玩家喜歡廣告；我們假設多數免費玩家理解：

> 免費遊戲需要某種商業交換，但廣告必須公平、可預測，而且不能破壞正在進行的活動。

### 廣告憲法

1. **拼圖 Session 中不插強制 Interstitial。**
2. 強制廣告只能存在於自然斷點，例如完成後、回 Gallery 後。
3. 不需要每次自然斷點都播廣告；頻率要保守。
4. Rewarded Ads 必須是玩家主動選擇。
5. `Remove Ads` 應是清楚的一次性購買，並真的移除所有非玩家主動要求的廣告。
6. 廣告音訊不得長期搶走 / 破壞 Podcast、Audiobook 或背景音樂；廣告結束後應正確恢復 Audio Session。

商店頁可明確承諾：

> **Free forever. No ads while you puzzle.**

這不是「完全沒有廣告」，而是「你在拼的時候我不煩你」。

---

## 7. 商業模式

初步方向：

### 免費玩家

- 免費核心拼圖；
- 在自然斷點看到少量廣告；
- 可選 Rewarded Ads 解鎖額外內容 / Hint / 特殊圖（是否導入需後續測試）。

### 付費玩家

- **一次性 Remove Ads**（初步可研究 US$3.99–4.99 或各地等值價位）；
- 不優先採訂閱；
- 後續若有高品質 Premium Collection，再獨立評估內容包，而不是先設計複雜商城。

核心原則：

> 免費版必須本身就是好產品；付費是「我常玩，而且願意支持 / 想要更乾淨」而不是被痛苦逼著付錢。

---

## 8. 個人化推薦：從「最大圖庫」轉向「你的圖庫」

現有大型拼圖 App 多數仍以：

- Nature
- Animals
- Flowers
- Places
- Art
- Daily
- Popular
- New

等大型分類為主要瀏覽方式。

Pieceful 的差異化假說：

> **我們不需要擁有最大的圖庫；我們需要讓玩家打開首頁時，大部分候選圖片都讓他想拼。**

### 圖片 Metadata

每張官方圖可包含：

- Subject：cat / temple / city / flower / food...
- Region / Culture：Japan / Taiwan / Europe...
- Mood：cozy / calm / nostalgic / bright...
- Visual：warm / cool / high contrast / pastel...
- Style：photo / illustration / painting...
- Scene：indoor / outdoor / night / autumn...
- Puzzleability：clear regions / repetitive texture / flat area / landmark density...
- Suggested difficulty range。

### 玩家行為訊號

不需要要求玩家先填問卷，可以逐步讀：

- Thumbnail impression → click；
- Start；
- Completion；
- Abandon；
- Favorite；
- Replay；
- Hint usage；
- 常選片數；
- 不同題材的完成率；
- Session 長度。

### V1 推薦引擎不需要 AI Runtime

最早版本甚至可以只用本機權重：

```text
favorite(tag)      +2
complete(tag)      +1
start(tag)         +0.3
abandon(tag)       -0.5
dislike(tag)       -3
```

然後：

```text
score(image) = Σ userPreference(tag) × imageTagWeight
```

這已經能做出：

- For You
- Because you liked Kyoto Autumn...
- More like this

而且可 local-first，不需要帳號。

### AI 的合理使用方式

AI 可放在「內容製作流程」而不是玩家 runtime：

- 批次替圖片產生 tags；
- 分析視覺結構；
- 提議 puzzleability；
- 人工抽查；
- 結果存成靜態 metadata。

這是一次性內容成本，不是長期 API 成本。

---

## 9. Gentle Progression：不是升級角色，而是看見自己的時間

傳統 F2P 常用：

- 星星；
- Coins；
- XP；
- Streak；
- Rank；
- Battle Pass。

Pieceful 的方向應更接近 **Pikmin Bloom 的低壓 progression 哲學**：

> 行為本身留下痕跡；今天做得少不是失敗，只是留下的痕跡比較少。

### Puzzle Journal / 拼圖日誌

可以真實記錄：

- 今日 / 本週拼圖時間；
- Pieces placed；
- Puzzles completed；
- Hint-free finishes；
- 最常拼的難度；
- 最喜歡的題材；
- 新嘗試的題材；
- 最長單次沉浸時間；
- 個人完成收藏。

例如：

> 今天拼了 37 分鐘  
> 放下 286 片  
> 完成 2 張圖  
> 第一次完成 Ukiyo-e 類別

### 不做假的健康數值

不顯示：

- 專注力 +12%；
- Stress -18%；
- 認知能力 +7；
- Brain Age -3。

可以顯示真實行為：

- Focused minutes；
- Quiet minutes；
- No-hint finish；
- Pattern challenge completed。

如果未來有 `Calm Score` 之類純遊戲指標，也必須非常清楚標示為 **playful session metric, not a health measurement**。

### 長期回顧

可研究：

- Daily Lookback；
- Weekly Lookback；
- Monthly recap；
- `Your Year in Pieces`（類 Spotify Wrapped）。

例如：

> 你今年放下了 38,421 片拼圖。  
> 你最常拼的題材是 Japan。  
> 你有 72 個晚上用拼圖結束一天。

目的不是逼玩家回來，而是：

> **替玩家留下他曾經享受過的時間。**

---

## 10. 內容策略

### 不是單純追求 30,000 / 60,000 張

頭部競品已經用「超大圖庫」建立規模優勢，Pieceful 一開始不應硬碰數量。

初步內容組合假說：

- 50%：大眾 proven themes（nature / cozy / animals / places）；
- 20%：East Asia / Japan / Taiwan；
- 15%：Art / Museum / History；
- 15%：實驗性題材。

### 圖片本身就是關卡設計

好的拼圖圖源不是只看「漂亮」，還要考慮：

- 有清楚區域；
- 有地標；
- 不要整片都是同色天空；
- 重複紋理適量；
- 不同難度有合理的可辨識性。

### 圖源

可研究：

- AI 自製內容（以 puzzleability 為導向）；
- 公有領域 / Open Access 藝術；
- Museum Open Access；
- 使用者自己的照片。

內容授權、商標、博物館名稱與館藏圖片授權需分開處理，不能因為圖片是 CC0 就默認可暗示官方合作或背書。

---

## 11. ASO 與品牌

品牌與 ASO 不必二選一。

品牌名：

> **Pieceful**

可能的商店名稱：

> **Pieceful: Jigsaw Puzzles**

中文：

> **拾光拼圖：經典拼圖遊戲**（工作版本）

初期不應只搶超級 Head Keyword `jigsaw puzzle`，而應研究 Long-tail：

- jigsaw puzzles for adults
- relaxing jigsaw puzzle
- jigsaw puzzle offline
- photo jigsaw puzzle
- make puzzle from photo
- uninterrupted jigsaw puzzle
- jigsaw puzzle for iPad

產品價值與搜尋詞可以分工：

- Brand：Pieceful
- Category：Jigsaw Puzzles
- Long-tail：Adults / Photo / Offline / Relaxing

---

## 12. 技術與營運原則

1. **Zero-server until proven necessary.**
2. **Zero recurring paid service until revenue justifies it.**
3. 圖片、玩家照片與 preference 優先 local-first。
4. 不因為「以後可能需要」就先建帳號系統。
5. 不承諾每週固定內容更新。
6. Analytics / Crash reporting 優先用免費級距。
7. 成熟後核心操作流程要非常穩定，不隨意重做 UI。
8. 目標是可一人長期營運，不是堆功能量。

---

## 13. V1 明確不做

- PvP；
- 排行榜；
- Guild / Clan；
- 聊天；
- 帳號與社群系統；
- 雲端同步（除非測試證明必要）；
- 故事模式；
- 3D 博物館；
- 完成後整幅畫動畫化；
- Battle Pass；
- Energy；
- Gacha；
- 每日登入懲罰型 Streak；
- Server-driven Live Ops；
- Runtime LLM / Vision API。

---

## 14. 第一階段真正要驗證的問題

不是「能不能寫出拼圖」。那只是工程問題。

真正需要驗證：

1. 拖、吸、Zoom、Pan 是否夠舒服？
2. 玩家能否在 30 秒內理解並開始？
3. 圖片縮圖是否能產生足夠 Click-to-Start？
4. 哪些主題最容易被選？
5. 哪些片數完成率最高？
6. 玩家是否會使用 Puzzle Me？
7. `No ads while you puzzle` 是否能提高 Rating / Retention / Conversion？
8. 個人化推薦是否提高 Start Rate / Completion Rate？
9. Puzzle Journal 是否讓玩家願意回來？
10. Remove Ads 的價格與轉換率是多少？

---

## 15. 目前的產品北極星

Pieceful 不需要成為全世界最大的拼圖 App。

它需要成為一小群玩家打開後會覺得：

> **「這裡總是有我想拼的圖，而且它不會來煩我。」**

若能做到這件事，內容量、推薦、低壓 Progression、廣告公平感與長期信任就會形成同一個產品方向，而不是五個分離的 Feature。