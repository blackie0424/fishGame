# 魚種像素圖：從去背照片到遊戲呈現

2026-07-08 建立（PR #3）。記錄 20 種魚像素圖依照片重校的做法，並定義後續
「上傳去背圖 → AI 繪製 → 寫入資料庫」的標準流程。

## 資料流

```
去背照片 public/images/removebg/<小寫魚名>.png
   │  （後台 AI 分析 或 依本文件人工/AI 推導）
   ▼
art JSON ──寫入──▶ fish_species.art（後台魚種設定，可手動修正）
   │                    │
   ▼                    ▼
前端 fallback        /api/game-config → serverConfig.js 套用
data/fishArt.js         │
                        ▼
              renderer/sprites.js drawFish()（18×12 像素、唯一渲染器）
```

- **正式環境以 DB 的 `fish_species.art` 為準**；`data/fishArt.js` 只是 API 不可用時的 fallback，兩邊改動時應同步。
- 後台編輯頁（魚種 → art 欄位）有**即時像素預覽**與**原始去背圖並排對照**，
  由 `adminFishPreview.js` 提供，用的是遊戲同一顆 `drawFish`，所見即所得。

## art JSON 欄位

| 欄位 | 必填 | 值域 | 說明 |
|---|---|---|---|
| `shape` | ✔ | `oval` / `long` / `deep` | 橢圓／細長（隆頭魚、鸚哥）／厚身高背（刺尾鯛、蝴蝶魚、砲彈魚） |
| `body`  | ✔ | `#rrggbb` | 魚身主色（側面中段的主要體色，避開陰影與反光） |
| `belly` | ✔ | `#rrggbb` | 腹部色，需比 body 淺 |
| `acc`   | ✔ | `#rrggbb` | 花紋／魚鰭強調色（pat 用此色繪製） |
| `pat`   | ✔ | `plain` / `spots` / `bars` / `hline` | 無紋／圓點／縱條／橫線 |
| `tail`  | 選 | `#rrggbb` | 尾鰭與身體顏色明顯不同時才填 |
| `bigEye`| 選 | `true` | 眼睛特別大時 |
| `wings` | 選 | `true` | 明顯展開胸鰭（飛魚類）時 |
| `note`  | 選 | 字串 | **中文特徵描述**，供管理員手動修正時參考，後台預覽會顯示 |
| `photo` | 選 | URL 路徑 | 原始去背圖位置；不填則依慣例 `/images/removebg/<小寫魚名>.png` |

前端會忽略未知欄位（`serverConfig.js` 以 `Object.assign` 套用），所以 `note`、`photo`
等後台專用欄位不影響遊戲。後端 AI 分析器（`FishImageAnalyzerController`）只放行
白名單欄位，`note`／`photo` 需由流程另行組入或手動填寫。

## 2026-07-08 重校方法（可重複）

1. **程式抽色**：對每張去背 PNG 取不透明像素（alpha>200），色彩量化（每通道 32 級）
   取眾數群，分區取樣——軀幹中上段→`body`、中下段→`belly`、最暗 25% 像素→`acc`、
   頭尾 12% 帶→`tail` 候選。腳本邏輯保存在本文件底部附錄。
2. **逐張目視校正**：抽色結果會被陰影／反光污染（黑褐色魚幾乎全靠目視），由人（或
   具視覺能力的 AI）看原圖決定 shape、pat、要不要 tail/bigEye/wings，並微調色碼。
3. **用實際渲染器驗證**：以 `drawFish` 把整組參數畫成 contact sheet 對照原圖確認，
   不能只看色碼數字。後台的並排對照就是做這件事的常設工具。
4. **三處落地**：data migration（正式 DB）＋ `GameDataSeeder`（新安裝）＋
   `data/fishArt.js`（前端 fallback），值必須一致。

## 後續標準流程（上傳去背圖 → AI 繪製 → 寫入 DB）

1. 去背圖命名為 `<小寫魚名>.png`（對齊 `fish_species.name`，如 `Amingang` →
   `amingang.png`），放入 `public/images/removebg/`；若放其他位置，在 art JSON 填 `photo`。
2. AI 依本文件推導 art JSON：
   - 只能使用上表欄位與值域（後端白名單會丟棄其餘欄位）。
   - 色碼取「乾淨體色」：避開陰影、反光、出血；黑褐色魚寧可比照片亮一階。
   - **必須附 `note`**：一句中文描述魚的關鍵特徵與像素圖的取捨
     （例：「畢卡索砲彈魚：上身砂黃、腹白，體側大塊黑斑超出現有花紋能力」）。
   - 寫入 DB：後台魚種編輯頁貼入 art 欄位儲存，或經 `admin.fish.analyze` API。
3. 管理員在後台編輯頁檢視**像素圖 × 原始去背圖並排**，識別差異後直接改 JSON
   （預覽即時重繪），儲存即生效（遊戲下次載入 config 取得新值）。

## 渲染器目前的表現能力（修正時的預期管理）

- 畫布 18×12 像素，特徵只能取「最主要的一項」。
- `hline` 只畫一條橫線：多條紋的魚（Acyod）取主色調＋一條紋意象。
- 大面積色塊（Savali 的黑斑）、漸層、頭部花紋（Veras 綠粉紋）無法呈現，
  記在 `note` 即可，勿硬湊 pat。
- 要提升擬真度應擴充 `drawFish`（新 pat 類型），再回頭補資料，順序不要反過來。

## 相關檔案

- 渲染器：`resources/game/renderer/sprites.js`（`drawFish`）
- 資料：`resources/game/data/fishArt.js`、`database/seeders/GameDataSeeder.php`、
  migration `2026_07_08_000001_update_fish_art_from_photos.php`（含 20 種魚的 note）
- 後台：`resources/game/adminFishPreview.js`（預覽＋並排）、
  `resources/game/utils/artJson.js`（`parseArtJson`／`removebgPhotoUrl`）、
  `app/Http/Controllers/Admin/FishImageAnalyzerController.php`（AI 分析、白名單）
- 測試：`tests/js/utils/artJson.test.js`、`tests/js/data/fishArt.test.js`、
  `tests/Feature/FishImageAnalyzerTest.php`

## 附錄：抽色腳本要點

```js
// 1) 取不透明像素 alpha>200，算 bounding box
// 2) 色彩量化：key = (r>>3,g>>3,b>>3)，眾數 bin 的平均即代表色
// 3) 分區：x ∈ [minX+22%W, maxX-22%W] 的中上段 → body、中下段 → belly
//    亮度最暗 25% 像素 → acc；頭尾 12% 橫帶 → tail 候選
// 4) 產出僅是「候選值」，一律需目視校正（陰影/反光會污染，黑魚尤甚）
```
