# 前端重構指南（fishGame）

> 給接手此專案的 AI 或開發者。重構目標：將 `game.js` 的多職責切分為單一職責模組，同時維持現有功能不退化。

---

## 現況與問題

`public/game/game.js` 目前約 2000 行，混合了以下職責：

| 職責 | 說明 |
|------|------|
| 音效引擎（SFX） | Web Audio API 合成、BGM 循環 |
| 場景縮圖繪製 | `siteThumb()`、Canvas 生成 |
| 遊戲狀態 G | 全域物件，各功能直接讀寫 |
| 回合流程 | `nextTurn / doFishing / endTurn / roundEnd` |
| AI 邏輯 | `aiPickSpot()` |
| 命運卡 / 行動卡判定 | `drawDestiny()` 內大型 switch |
| 角色設定 UI | `renderRoleList / renderSiteList` |
| 開場動畫 | `playIntro()` |
| 骰子 UI | `rollDice()` |
| 結算 / 分享 | `finishGame / sharePhase` |

---

## 重構原則

1. **每次只動一層**：先抽工具函式、再抽 UI 元件、最後整理流程。每次 PR 只動一個職責。
2. **模組只匯出純函式**：不直接依賴全域 `G`，透過參數傳入狀態，回傳新值。
3. **測試先行**：每個新模組搭配 `tests/js/` 測試，確認邊界行為再刪舊程式碼。
4. **G 物件不要全面重寫**：它是整個 game.js 的共享狀態，目前要用漸進式讀寫介面包裝，不要一次重構成 Redux 式。
5. **不改變對外 API**：`launchGame()` 仍由 HTML onclick 呼叫，保持進入點不變。

---

## 建議分階段執行

### Phase A：音效模組化（已部分完成）
- 目標：`SFX` 物件移至 `utils/sfx.js`
- 風險：低。SFX 是獨立閉包，無外部依賴。
- 測試：mock AudioContext，確認 muted 行為。

### Phase B：AI 邏輯模組化
- 目標：`aiPickSpot()` 移至 `ai/aiPlayer.js`
- 輸入：`{spots, site, players, round, activeBanned}` 純狀態
- 輸出：0–5 的點位索引
- 風險：低。目前已有明確輸入/輸出。
- 測試：固定亂數種子，驗證在各場地/條件下的選點分佈。

### Phase C：命運卡 / 行動卡判定邏輯
- 目標：`drawDestiny()` 的 switch 拆為 `engine/destinyEngine.js`
- 每個 case 變成獨立純函式，例如 `handleSnag(p, rollFn)`
- 輸入：命運卡種類、玩家狀態、骰子函式（注入依賴）
- 輸出：`{proceed, flags, sideEffect}` 狀態更新描述
- 風險：中。async / rollDice UI 與邏輯混合，需小心分離。
- 測試：mock `rollDice`，驗證每種命運卡的輸出。

### Phase D：UI 元件化
- 目標：`renderRoleList / renderSiteList / renderPlayers` 移至 `ui/setupUI.js`
- 原則：純函式，傳入容器 DOM + 資料，不讀全域 G。
- 風險：中。DOM 操作與 G 耦合需解開。

### Phase E：回合流程精簡
- 目標：`nextTurn / endTurn / roundEnd` 的業務邏輯抽出，game.js 只負責串接
- 分離「狀態轉換」（純函式）與「副作用」（toast / SFX / 動畫）

---

## 已完成的模組

| 模組 | 路徑 | 說明 |
|------|------|------|
| 盤面純邏輯 | `utils/board.js` | siteCaps / pickBannedSpots / refillBoard |
| 後台設定套用 | `config/serverConfig.js` | applyServerConfig |
| 遊戲狀態 | `state/GameState.js` | createGameState / advanceTurn |
| 卡牌牌堆 | `utils/deck.js` | buildFishSupply / buildActionDeck |
| 判定規則 | `utils/rules.js` | fishPass / fishAuto / siteTier |

---

## 重構時的常見陷阱

### ES Module live binding
`FISH_SPECIES`、`ROLES`、`SITE_CARDS` 從其他模組 import 進來，不能直接重新賦值（`FISH_SPECIES = []` 會報錯）。必須用 `.length = 0` + `.push()` 原地修改。

### G.activeBanned 的 Set
`pickBannedSpots()` 會 `G.activeBanned = new Set(...)` 重新賦值，外部不能持有舊 Set 的參考。

### async / await 中的 G 狀態
`doFishing` 在 await 期間（等待玩家操作），`G.spots` 可能被其他邏輯修改（雖然 `G.busy=true` 防重入）。重構時要確保狀態一致性。

### applyServerConfig 必須在 launchGame 前完成
`loadServerConfig()` 是 async，`window.addEventListener("load", async()=>{ await loadServerConfig(); ... })` 確保順序正確。重構時不要破壞這個執行順序。
