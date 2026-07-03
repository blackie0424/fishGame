# 蘭嶼釣魚趣 — Laravel 12 全端版

達悟族捕魚桌遊的數位互動版：Laravel 12.x + MySQL 後端 + 原生 Canvas 像素遊戲前端。
**所有遊戲項目皆可於後台動態管理**：魚牌、角色、場地卡、命運卡、拉竿卡、自然的反撲、遊戲參數。

## 架構

```
app/
  Http/Controllers/GameConfigController.php   # GET /api/game-config（快取，後台異動自動失效）
  Http/Controllers/Admin/AdminController.php  # 註冊表驅動 CRUD（七種實體共用）
  Http/Controllers/Admin/AuthController.php   # 極簡密碼登入（ADMIN_PASSWORD）
  Http/Middleware/AdminAuth.php
  Models/…                                    # FishSpecies / Role / SiteCard / DestinyCard / ActionCard / EnvCard / GameSetting
database/
  migrations/2026_07_03_000001_create_game_tables.php
  seeders/GameDataSeeder.php                  # 完整遊戲資料（含勝率校準後的牌組配比）
resources/views/
  game.blade.php                              # 遊戲頁（/）
  layouts/admin.blade.php + admin/…           # 後台
public/game/
  game.css / game.js                          # 遊戲樣式與邏輯（開局自 API 載入設定，離線 fallback 內建預設）
routes/web.php
```

## 安裝

```bash
composer install
cp .env.example .env && php artisan key:generate
# .env 設定 MySQL 連線（DB_DATABASE=lanyu_fishing 等）與 ADMIN_PASSWORD
php artisan migrate --seed
php artisan serve
```

- 遊戲：http://127.0.0.1:8000/
- 後台：http://127.0.0.1:8000/admin（密碼 = `.env` 的 `ADMIN_PASSWORD`）
- 設定 API：GET `/api/game-config`

## 動態管理重點

| 後台項目 | 對應玩法 |
|---|---|
| 魚牌 | 魚種、張數、難度（＝捕獲判定門檻）、像素圖參數 |
| 場地卡 | 判定邏輯（≥/>）、限制點位、場上總張數、場景視覺 |
| 命運卡 / 拉竿卡 | 三欄張數＝低/中/高難度的牌組配比（現值為勝率校準結果：低 ≥90%、中 75-85%、高 60-70%）|
| 自然的反撲 | 回合結束事件的張數與文案 |
| 遊戲設定 | 回合數、集體目標、隱藏機率區座標、補魚隨機比例、音樂加速回合 |

後台任何儲存都會清除 `game-config` 快取；玩家重新整理遊戲頁即取得最新設定。
前端動畫以 `key` 對應（新增卡片時沿用既有 key 可重用動畫，未知 key 會以文字卡呈現）。

## Zeabur 部署備忘

- PHP 服務指向本專案，`DB_*` 指到 MySQL 服務；持久化不需 Volume（純資料庫）。
- 首次部署後執行 `php artisan migrate --seed`。
