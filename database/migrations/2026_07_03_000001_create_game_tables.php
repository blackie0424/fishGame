<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 蘭嶼釣魚趣 — 遊戲資料表
 * 所有遊戲項目（魚種/角色/場地卡/命運卡/拉竿卡/自然反撲/遊戲設定）皆可於後台動態管理
 */
return new class extends Migration
{
    public function up(): void
    {
        // 魚牌（撲克牌版本 52 張的組成）
        Schema::create('fish_species', function (Blueprint $table) {
            $table->id();
            $table->string('name', 32)->unique();          // 魚名（達悟語）
            $table->string('category', 16);                 // Rahet / Oyod
            $table->unsignedTinyInteger('difficulty');      // 1~5：捕獲判定 = 骰子 vs 難度
            $table->unsignedTinyInteger('card_count');      // 此魚種在牌庫中的張數
            $table->json('art');                            // 像素圖參數 {shape,body,belly,acc,pat,bigEye,wings,tail}
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 角色
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 32);
            $table->string('emoji', 16)->nullable();
            $table->unsignedTinyInteger('need');            // 至少幾條魚
            $table->json('targets')->nullable();            // 指定目標魚，如 ["Ilek"]
            $table->string('description');
            $table->string('skin', 9);                      // 像素膚色
            $table->string('cloth', 9);                     // 像素服色
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 場地卡（15 張）
        Schema::create('site_cards', function (Blueprint $table) {
            $table->id();
            $table->string('name', 64);
            $table->enum('rule', ['gte', 'gt']);            // 判定邏輯：骰 ≥ / > 魚難度
            $table->json('banned');                         // 限制點位（1~6）
            $table->unsignedTinyInteger('board_total');     // 場上固定魚牌總數
            $table->string('description');
            $table->json('vis');                            // 場景視覺 {wave,rock,cur,dark,dusk,cliff,cave,dome,sand,tide}
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 命運卡（依場地分級配比）
        Schema::create('destiny_cards', function (Blueprint $table) {
            $table->id();
            $table->string('key', 24)->unique();            // 對應前端動畫 t
            $table->string('title', 64);
            $table->string('content');                      // 卡片內容敘述
            $table->string('result');                       // 卡片結果敘述
            $table->string('kind', 24);                     // fail/snag/tangle/wind/eel/bigwave/go/go_swallow/go_double
            $table->unsignedTinyInteger('count_low');       // 低難度場地張數
            $table->unsignedTinyInteger('count_mid');
            $table->unsignedTinyInteger('count_high');
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 拉竿卡（依場地分級配比；含「魚已上鉤」語境文案）
        Schema::create('action_cards', function (Blueprint $table) {
            $table->id();
            $table->string('key', 24)->unique();            // hit/double/tangle/swallow/baitlost/snag
            $table->string('emoji', 16)->nullable();
            $table->string('title', 64);
            $table->string('description');
            $table->string('flavor');
            $table->json('hooked')->nullable();             // 上鉤語境 {emoji,title,desc,flavor}
            $table->unsignedTinyInteger('count_low');
            $table->unsignedTinyInteger('count_mid');
            $table->unsignedTinyInteger('count_high');
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 自然的反撲（回合結束環境事件）
        Schema::create('env_cards', function (Blueprint $table) {
            $table->id();
            $table->string('key', 24)->unique();            // 對應前端動畫 animType
            $table->string('emoji', 16)->nullable();
            $table->string('title', 64);
            $table->string('description');
            $table->string('flavor');
            $table->unsignedTinyInteger('card_count');      // 牌組張數
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        // 遊戲設定（key-value JSON）
        Schema::create('game_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 48)->unique();            // rounds / collective_goal / spot_positions ...
            $table->json('value');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_settings');
        Schema::dropIfExists('env_cards');
        Schema::dropIfExists('action_cards');
        Schema::dropIfExists('destiny_cards');
        Schema::dropIfExists('site_cards');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('fish_species');
    }
};
