# AGENTS.md — 給 AI 協作者的專案說明（蘭嶼釣魚趣 fishGame）

> 任何 AI 模型（Sonnet / Kiro / Gemini / 其他）接手本專案前，請先完整閱讀本文件。
> 建議放置路徑：`docs/AGENTS.md`，並隨架構變動更新。

## 專案是什麼

以達悟（Tao）族傳統漁撈文化為主題的數位互動桌遊。雙層架構：

- **前端**：HTML5 Canvas + 原生 JS（ES modules），像素風、回合制、AI 對手，源碼位於 `resources/game/`，由 Vite 打包為 `public/build/assets/game-<hash>.js/.css`（blade 用 `@vite` 載入；**勿把 JS 放回 public/**）
- **後端**：Laravel 12 + MySQL，後台 CRUD 動態管理所有遊戲資料（魚種/角色/場地/命運卡/行動卡/環境卡/設定），`/api/game-config` 供前端載入

Repo：`github.com/blackie0424/fishGame`（main）

## 模組地圖（前端）

```
resources/game/
├─ game.js              # 主流程：UI、回合、doFishing、endTurn（薄包裝層）
├─ data/                # 純資料（fish/sites/cards/roles/fishArt/intro）
├─ utils/
│  ├─ deck.js           # 洗牌、建牌堆（buildFishSupply 等）
│  ├─ rules.js          # 判定規則（fishPass/fishAuto/siteTier）
│  └─ board.js          # 盤面純邏輯（siteCaps/pickBannedSpots/refillBoard/boardHasFish）
├─ config/serverConfig.js  # 後台設定套用（applyServerConfig + 防呆）
├─ state/GameState.js   # 純狀態（createGameState/advanceTurn）
└─ renderer/            # Canvas 繪圖（sprites/scene/fight）
tests/js/               # vitest，13 檔 122+ 測試
```

## ⚠️ 資料契約（本專案最重要的一條規則）

`FISH_SPECIES`、`SITE_CARDS`、`ROLES` 等是**跨模組共享的可變單例**（module singleton），
`config/serverConfig.js` 會在執行期就地覆寫它們。**元素必須是物件格式**：

```js
// FISH_SPECIES 元素契約（違反 = 魚庫為空 = 每竿「水域沒有魚」）
{ name:string, count:number(>0), diff:number, category:string, colors:[..] }
// SITE_CARDS 元素契約
{ name, rule:"gte"|"gt", banned:number[], total:number(>0), desc, vis }
```

歷史事故（2026-07-05, commit 70f1108）：重構時 `applyServerConfig` 把魚塞成**陣列**，
`buildFishSupply` 讀 `f.count` 全為 undefined → 魚庫 0 條 → 100% 顯示「水域沒有魚」。
回歸測試在 `tests/js/config/serverConfig.test.js`，**改動資料格式前先跑它**。

## 雙資料來源（第二重要）

前端有兩條資料路徑，行為必須一致、**測試要各測一條**：
1. 內建預設值（`data/*.js`）——`/api/game-config` 失敗時的 fallback
2. 後台覆蓋（`serverConfig.js`）——API 成功時就地改寫單例

陷阱：**bug 若只存在路徑 2，本機沒接後端測不出來**。驗證修正時務必接上 Laravel（`php artisan serve`）實測。

## 常用指令

```bash
npm test                          # vitest 全套（改任何 js 前後都要跑）
node --check resources/game/game.js  # 語法檢查
npm run build                     # Vite 打包（部署管線會自動跑）
php artisan migrate --seed        # 建表 + 種子資料（52 條魚、15 場地）
php artisan view:clear            # blade 有改就要跑
```

## 遊戲核心數字（改平衡前先知道）

- 魚牌總量 **52**；場上容量 = `site.total`（低階 10／中階 7／高階 5），其餘留在魚庫 `fishSupply`
- 6 個水域點位；禁放數 = `site.banned.length`，**每回合隨機重抽位置**
- 15 回合 × 每回合 4 人出竿；命運卡約 80% 進入拉竿
- 勝率校準目標：低階 ~94%／中階 ~77%／高階 ~62%（用無頭模擬驗證，≥300 局）
- 「水域沒有魚」訊息**只允許**在 52 條全被釣光的終局出現（`ensureBoardHasFish` 保證）

## 文化與設計規範（不可違反）

- 任何場景**不得出現傳統拼板舟（tatala）**
- 海面漸層：近岸淺、深水深
- 纏線事件對象 = 岸上**距離最近**的玩家（不是下一位）
- 漁獲池顯示全體玩家漁獲（共享文化）；集體目標 = 各角色最低需求加總
- 魚放置：35% 完全隨機 / 65% 依深度偏好（後台 `random_fish_ratio` 可調）；候選池內再依權重抽選：`low_fish_bias^(5-diff) × (目標魚 ? target_fish_weight : 1)`，預設 1.7 / 0.35（低難度魚增量、目標魚減量；機率表與模擬方法見 README「魚種出現機制」）

## 部署檢查清單

1. 主機 `git pull origin main`
2. `php artisan view:clear`（blade 有改時）；改過遊戲資料則後台任存一筆或 `php artisan cache:clear`（`/api/game-config` 用 `rememberForever` 快取）
3. 驗明正身：`curl -s https://主機/ | grep -o 'build/assets/game-[^"]*'`，hash 應與本次 build 一致
4. 資產檔名帶內容 hash，瀏覽器**不需**硬重整（HTML 本身 no-cache）

## 除錯 SOP（本專案血淚驗證）

1. 先問頻率：**100% 必現** → 查初始化/設定路徑/線上版本；**偶發** → 查資源耗盡/邊界條件
2. 先重現再修：寫無頭模擬或最小腳本；重現不了 = 環境問題，去查快取與部署版本
3. 儀器先行：在狀態邊界加 `console.info`（魚庫長度、refill 後各點位數）看數據再假設
4. 100% 重現的回歸 → `git bisect`，4~5 步鎖定肇事 commit
5. 每個修正必附回歸測試 + 量化驗證（模擬前後對比）

## 已知歷史事件索引

| Commit | 事件 |
|---|---|
| 5b72c7c~abdf01e | 重構 phase1–4（ES modules 化）；phase1 同時改格式埋下事故 |
| 70f1108 | 修復陣列映射（「水域沒有魚」100% 事故主因） |
| f514afb | 遞補可回補魚庫 + card_count 防呆 + 資產版本參數 |
| c035682 | phase5：抽出 board/serverConfig 模組 + 18 個回歸測試 |
| f00f159 | drawFish 改物件解構（phase1 格式事故餘波之一） |
| 36431eb | 前端改 Vite 打包（hash 檔名），源碼移至 resources/game，根絕 stale cache |
| e72c8a4 | renderPool 等 4 處 f.sp + 1 處 f.cat 舊格式殘留 → 開局卡死；回歸測試 drawFishContract.test.js |
