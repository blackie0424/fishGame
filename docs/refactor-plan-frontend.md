# 前端重構計畫（Phase 6–9）— 給接手 AI 的執行文件

> 撰於 2026-07-06（由 Hacci 分析、Wu 核准方向）。
> 接手前**必讀** `docs/AGENTS.md`（專案慣例、資料契約、除錯 SOP）。
> 本文件描述「還沒做」的重構；Phase 1–5 已完成（data/utils/board/serverConfig/GameState/renderer 抽離）。

## 為什麼要重構

`resources/game/game.js` 約 1,860 行，混了音效引擎、canvas 場景、卡片動畫、
DOM 渲染、回合規則、AI、啟動流程等多種職責。但**最關鍵的動機是規則重複**：

`drawDestiny` / `doFishing` / `roundEnd` / `aiPickSpot` 在兩處各有一份實作——

- `resources/game/game.js`（UI 版，夾雜動畫與 await）
- `resources/game/sim/simCore.js`（無頭版，供後台勝率試算與 CLI 模擬）

**每次改規則都必須手動雙寫**（2026-07-06 的命運簡化、風太大二段式、分魚 v2 皆如此）。
哪天漏改一邊，後台「勝率試算」就會默默失真。重構的終極目標＝**規則只有一份**。

## 不可破壞的既有事實（動手前先知道）

1. **共享可變單例**：`FISH_SPECIES`、`SITE_CARDS`、`ROLES`、`DESTINY_MIX` 等由
   `config/serverConfig.js` 在執行期就地覆寫（見 AGENTS.md「資料契約」）。
   重構時**不可**把它們變成複本傳遞，否則後台設定會失效。
2. **雙資料路徑**：內建預設 + `/api/game-config` 覆蓋，行為必須一致。
3. `utils/share.js`（耆老分魚 v2）已是共用純邏輯——這就是 Phase 8 要達成的樣板。
4. 已有 154+ 個 vitest（`tests/js/`），任何階段結束必須全綠。
5. Vite 入口：`resources/game/game.js`、`resources/game/simUI.js`（見 `vite.config.js`）。
   新增模組不需要動 vite 設定（相對 import 會被打包），**新增入口才要**。
6. 部署：push main 即自動部署；資產帶 hash，無快取問題。
7. **文化規範**（AGENTS.md）不可違反；文案一字不改（除非 Wu 指示）。

## 執行紀律（每個 Phase 都一樣）

1. **先寫 characterization 測試**（紅→綠；Wu 的 TDD 要求，違反過一次被抓過）
2. 純搬家＝搬完 `node --check` + `npx vitest run` 全綠 + `npm run build` 成功
3. 手動驗證：本機或線上實玩一局（開局→出竿→骰子→結算走完）
4. 一個 Phase 一個 commit、一次部署；commit message 記錄搬了什麼、行數變化
5. 檔案上限 ~400 行；禁止循環 import；模組單一職責
6. 完成後更新 `docs/AGENTS.md` 的模組地圖與歷史索引，並在本文件勾掉該 Phase

---

## Phase 6 — 抽離與規則無關的引擎（低風險，先做）

純搬家，不改任何行為。game.js 內以區塊註解分段，搜尋標題即可定位。

| 新檔案 | 從 game.js 搬出 | 內容 |
|---|---|---|
| `audio/sfx.js` | 「音效引擎」區塊 | `SFX` 物件、BGM（tone/noise/bgmStep…）。依賴 `CFG.bgmSpeedRound`、`CFG.rounds` → 以參數或 setter 注入，不 import game.js |
| `ui/dom.js` | 「工具」+「UI 基礎」 | `$`、`sleep`、`showScreen`、`toast`、`addLog`、`setBanner` |
| `ui/panels.js` | 「UI 基礎」後半 | `renderPool`、`renderMyHud`、`renderPlayers`、`taskHTML`（依賴 G/CFG → 以參數傳入） |

注意：這些函數目前直接讀全域 `G`、`CFG`。搬家時優先「參數注入」；
若牽動太大，過渡做法是模組內 `let deps; export function bind(d){deps=d}`，
由 game.js 開局時 bind——記在 TODO，Phase 9 收掉。

測試：UI/音效無法無頭驗證，characterization ＝ exports 存在 + game.js 匯入後
`node --check` 過 + build 過 + 手動一局。

## Phase 7 — 場景與動畫層（中風險）

| 新檔案 | 從 game.js 搬出 |
|---|---|
| `renderer/beach.js` | 「海邊釣魚場景引擎」整塊（~330 行）：場景繪製、`FISHERS`、走動/甩竿動畫、`POOL_VIEW` 水窪 |
| `renderer/cardAnims.js` | 「環境卡動畫」+「命運卡動畫」（`envAnim`/`destinyAnim`，~270 行） |
| `ui/cardShow.js` | 「卡片展示（翻牌動畫）」`showCard` |
| `ui/dice.js` | 「骰子」`rollDice`（搏鬥動畫掛勾 `startFightScene` 保留於 game.js 或一併搬） |

renderer/ 已有 sprites/scene/fight 慣例，照樣延伸。同 Phase 6 的依賴注入原則。

## Phase 8 — 規則單一事實來源（核心目標，最重要）

**做法：把 `sim/simCore.js` 的無頭規則升格為 `core/rules.js`，以 hooks 參數化副作用。**

1. 新增 `core/rules.js`：搬入 simCore 的 `drawDestiny`、`doFishing`、`roundEnd`、
   `aiPickSpot`、`ensureBoardHasFish`（連同其依賴的 refill 包裝）。
   每個函數接受 `hooks` 物件，預設全 no-op、擲骰＝隨機立即：
   ```js
   // hooks 介面（全部 optional，回傳 Promise 或值皆可）
   {
     rollDice(p, hint, passFn, opts),   // 回傳 1..6；UI 版彈骰子動畫
     showCard(kind, info, isHuman),     // 翻牌動畫
     toast(msg), log(msg, cls),         // 訊息
     onCatch(p, fishes, caption),       // 捕獲展示
     onRefill(), onRest(p), …           // 視實作補齊
   }
   ```
2. `sim/simCore.js` 改為：`import { … } from '../core/rules.js'`，
   傳入 no-op hooks（現有 sim 測試不得改斷言——它們就是 characterization）。
3. `game.js` 的 `drawDestiny`/`doFishing`/`roundEnd` 刪除，改呼叫 core 並傳
   「動畫版 hooks」（rollDice→現有骰子 UI、showCard→翻牌、onCatch→showCatch…）。
   文案字串隨邏輯搬進 core（log 內容屬於規則敘事）或由 hooks 組字——擇一，
   但**同一句話只能存在一處**。
4. 完成判準：`grep -c "case 'go_double'" resources/game` 只剩 core/rules.js 一處；
   全部規則測試（simCore/board/share/cards）不改斷言全綠。

風險控管：這階段 diff 最大，先寫「固定牌堆序列 → 結果斷言」的 characterization
測試鎖住 doFishing 全部分支（hit/double/swallow/tangle/baitlost/snag ×
destiny go/fail/骰運類），再動手。

## Phase 9 — 啟動流程收尾（低風險）

| 新檔案 | 內容 |
|---|---|
| `boot/setup.js` | 設定畫面（人數/角色選擇） |
| `boot/intro.js` | 開場劇情動畫（INTRO_SCENES 播放） |
| `boot/launch.js` | `launchGame`、事件綁定、serverConfig 載入 |

完成後 `game.js` 應只剩組裝（目標 <250 行），可考慮改名 `main.js`
（要同步改 `vite.config.js` 入口與 `game.blade.php` 的 @vite 路徑）。

## 完成後的目標結構

```
resources/game/
├─ main.js（原 game.js，薄組裝層）
├─ core/rules.js        # 唯一的規則實作（hooks 注入副作用）★
├─ audio/sfx.js
├─ ui/（dom / panels / dice / cardShow）
├─ renderer/（sprites / scene / fight / beach / cardAnims）
├─ sim/simCore.js       # = core/rules + no-op hooks
├─ data/ utils/ config/ state/   # 不動（Phase 1–5 成果）
```

## 各 Phase 驗收清單

- [ ] Phase 6：audio/ui 抽離；game.js < 1,600 行
- [ ] Phase 7：場景動畫抽離；game.js < 1,000 行
- [ ] Phase 8：core/rules.js 單一事實來源；simCore 無自有規則；game.js < 600 行
- [ ] Phase 9：boot 抽離；main.js < 250 行；AGENTS.md 模組地圖更新完畢
