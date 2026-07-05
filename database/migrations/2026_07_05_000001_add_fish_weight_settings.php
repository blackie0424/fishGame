<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/* 魚種出現機率權重（2026-07-05 難度調整）：
   既有環境的 game_settings 補上兩個可調參數；前端缺值時使用相同的內建預設。 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        DB::table('game_settings')->insertOrIgnore([
            ['key' => 'low_fish_bias', 'value' => json_encode(1.7), 'description' => '補魚權重：每低一級難度乘的倍率（1 = 不偏好）', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'target_fish_weight', 'value' => json_encode(0.35), 'description' => '補魚權重：目標魚額外乘的倍率（1 = 不減量）', 'created_at' => $now, 'updated_at' => $now],
        ]);
        Cache::forget(\App\Http\Controllers\GameConfigController::CACHE_KEY);
    }

    public function down(): void
    {
        DB::table('game_settings')->whereIn('key', ['low_fish_bias', 'target_fish_weight'])->delete();
        Cache::forget(\App\Http\Controllers\GameConfigController::CACHE_KEY);
    }
};
