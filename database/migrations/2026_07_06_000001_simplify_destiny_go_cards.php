<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/* 2026-07-06 規則改造：命運卡只回答「魚咬不咬餌」——
   吞鉤/雙鉤張數併入「中魚」，收線事件全由拉竿卡決定。
   卡片列保留（張數 0），後台可隨時重新啟用。 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('destiny_cards')->where('key', 'hooked')
            ->update(['count_low' => 24, 'count_mid' => 22, 'count_high' => 24, 'updated_at' => now()]);
        DB::table('destiny_cards')->whereIn('key', ['swallow', 'double'])
            ->update(['count_low' => 0, 'count_mid' => 0, 'count_high' => 0, 'updated_at' => now()]);
        Cache::forget(\App\Http\Controllers\GameConfigController::CACHE_KEY);
    }

    public function down(): void
    {
        DB::table('destiny_cards')->where('key', 'hooked')
            ->update(['count_low' => 15, 'count_mid' => 14, 'count_high' => 14, 'updated_at' => now()]);
        DB::table('destiny_cards')->where('key', 'swallow')
            ->update(['count_low' => 3, 'count_mid' => 3, 'count_high' => 3, 'updated_at' => now()]);
        DB::table('destiny_cards')->where('key', 'double')
            ->update(['count_low' => 6, 'count_mid' => 5, 'count_high' => 7, 'updated_at' => now()]);
        Cache::forget(\App\Http\Controllers\GameConfigController::CACHE_KEY);
    }
};
