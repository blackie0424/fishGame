<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 蘭嶼釣魚趣完整遊戲資料（自最終版遊戲程式自動萃取，已含勝率校準參數）
 * 執行：php artisan migrate --seed 或 php artisan db:seed --class=GameDataSeeder
 */
class GameDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('fish_species')->insertOrIgnore([
            ['name' => 'Lagarow', 'category' => 'Rahet', 'difficulty' => 1, 'card_count' => 4, 'art' => json_encode(['shape' => 'long', 'body' => '#a8b0b5', 'belly' => '#dde2e5', 'acc' => '#666e73', 'pat' => 'plain']), 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Tangara', 'category' => 'Rahet', 'difficulty' => 1, 'card_count' => 3, 'art' => json_encode(['shape' => 'oval', 'body' => '#d97a70', 'belly' => '#f2c5bd', 'acc' => '#a03a30', 'pat' => 'plain', 'bigEye' => true]), 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Kozapo', 'category' => 'Rahet', 'difficulty' => 1, 'card_count' => 4, 'art' => json_encode(['shape' => 'oval', 'body' => '#8a4a3a', 'belly' => '#c99a80', 'acc' => '#54291f', 'pat' => 'spots']), 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Lalavok', 'category' => 'Rahet', 'difficulty' => 1, 'card_count' => 3, 'art' => json_encode(['shape' => 'oval', 'body' => '#c5ced6', 'belly' => '#f2f5f8', 'acc' => '#8a99a5', 'pat' => 'plain', 'tail' => '#d9c05f']), 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Takazit', 'category' => 'Rahet', 'difficulty' => 1, 'card_count' => 3, 'art' => json_encode(['shape' => 'oval', 'body' => '#b0a288', 'belly' => '#e2d9c5', 'acc' => '#6f6248', 'pat' => 'plain']), 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cirow', 'category' => 'Rahet', 'difficulty' => 2, 'card_count' => 4, 'art' => json_encode(['shape' => 'oval', 'body' => '#c9a05f', 'belly' => '#ecd9ad', 'acc' => '#8a6a30', 'pat' => 'spots']), 'sort' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Kowaos', 'category' => 'Rahet', 'difficulty' => 2, 'card_count' => 3, 'art' => json_encode(['shape' => 'long', 'body' => '#9aa8b0', 'belly' => '#d8dee2', 'acc' => '#556570', 'pat' => 'hline']), 'sort' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Kosikosi', 'category' => 'Oyod', 'difficulty' => 2, 'card_count' => 3, 'art' => json_encode(['shape' => 'oval', 'body' => '#e8d9a0', 'belly' => '#f7f0d0', 'acc' => '#26262a', 'pat' => 'bars']), 'sort' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Malan', 'category' => 'Oyod', 'difficulty' => 2, 'card_count' => 3, 'art' => json_encode(['shape' => 'oval', 'body' => '#7a8fa0', 'belly' => '#c2cfd8', 'acc' => '#46596a', 'pat' => 'plain']), 'sort' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Amingang', 'category' => 'Oyod', 'difficulty' => 2, 'card_count' => 2, 'art' => json_encode(['shape' => 'long', 'body' => '#b8c4cc', 'belly' => '#eef2f5', 'acc' => '#5a7a8c', 'pat' => 'hline']), 'sort' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Savali', 'category' => 'Oyod', 'difficulty' => 2, 'card_count' => 2, 'art' => json_encode(['shape' => 'long', 'body' => '#bcc8d0', 'belly' => '#f0f4f6', 'acc' => '#46565f', 'pat' => 'hline']), 'sort' => 10, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Veras', 'category' => 'Oyod', 'difficulty' => 2, 'card_count' => 2, 'art' => json_encode(['shape' => 'oval', 'body' => '#3a5a7a', 'belly' => '#a8c2d8', 'acc' => '#1c344c', 'pat' => 'plain', 'wings' => true]), 'sort' => 11, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Angsa', 'category' => 'Rahet', 'difficulty' => 3, 'card_count' => 3, 'art' => json_encode(['shape' => 'deep', 'body' => '#aab4bd', 'belly' => '#e2e8ec', 'acc' => '#6a757e', 'pat' => 'plain']), 'sort' => 12, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mahabteng', 'category' => 'Oyod', 'difficulty' => 3, 'card_count' => 2, 'art' => json_encode(['shape' => 'oval', 'body' => '#4f3a30', 'belly' => '#8a6f60', 'acc' => '#f0e8d8', 'pat' => 'spots']), 'sort' => 13, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Anid', 'category' => 'Rahet', 'difficulty' => 4, 'card_count' => 3, 'art' => json_encode(['shape' => 'deep', 'body' => '#4a4f55', 'belly' => '#8a9096', 'acc' => '#26292d', 'pat' => 'plain']), 'sort' => 14, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Tapez', 'category' => 'Rahet', 'difficulty' => 4, 'card_count' => 2, 'art' => json_encode(['shape' => 'deep', 'body' => '#b5bec8', 'belly' => '#e8edf2', 'acc' => '#6a7684', 'pat' => 'plain', 'tail' => '#d9b84c']), 'sort' => 15, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Acyod', 'category' => 'Rahet', 'difficulty' => 5, 'card_count' => 2, 'art' => json_encode(['shape' => 'deep', 'body' => '#d9402f', 'belly' => '#f2a08a', 'acc' => '#7a1512', 'pat' => 'plain', 'bigEye' => true]), 'sort' => 16, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cilat', 'category' => 'Rahet', 'difficulty' => 5, 'card_count' => 2, 'art' => json_encode(['shape' => 'deep', 'body' => '#c8d2da', 'belly' => '#f2f5f8', 'acc' => '#7f8fa2', 'pat' => 'plain']), 'sort' => 17, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Ilek', 'category' => 'Oyod', 'difficulty' => 5, 'card_count' => 1, 'art' => json_encode(['shape' => 'oval', 'body' => '#b8a94c', 'belly' => '#e6dfa8', 'acc' => '#6f6524', 'pat' => 'spots']), 'sort' => 18, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Arawa', 'category' => 'Oyod', 'difficulty' => 5, 'card_count' => 1, 'art' => json_encode(['shape' => 'long', 'body' => '#c0ccd4', 'belly' => '#f0f4f7', 'acc' => '#607a88', 'pat' => 'hline']), 'sort' => 19, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('roles')->insertOrIgnore([
            ['name' => '小孩', 'emoji' => '🧒', 'need' => 3, 'targets' => null, 'description' => '至少 3 條魚', 'skin' => '#f0c8a0', 'cloth' => '#4a90d8', 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '成年男子', 'emoji' => '🧑', 'need' => 5, 'targets' => json_encode(['Cilat']), 'description' => '至少 5 條魚，含 cilat 一隻', 'skin' => '#d8a878', 'cloth' => '#c1272d', 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '結婚的男人', 'emoji' => '👨', 'need' => 6, 'targets' => json_encode(['Ilek']), 'description' => '至少 6 條魚，含 ilek 一隻', 'skin' => '#c89868', 'cloth' => '#2d8a4c', 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '有小孩的爸爸', 'emoji' => '👨‍👧', 'need' => 6, 'targets' => json_encode(['Ilek']), 'description' => '至少 6 條魚，含 ilek 一隻', 'skin' => '#b88858', 'cloth' => '#8a5c2d', 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '有孫子的阿公', 'emoji' => '👴', 'need' => 3, 'targets' => json_encode(['Tapez', 'Acyod']), 'description' => '至少 3 條魚，含 tapez 或 acyod 一隻', 'skin' => '#c8a888', 'cloth' => '#5c5c6e', 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('site_cards')->insertOrIgnore([
            ['name' => '龍門港內', 'rule' => 'gte', 'banned' => json_encode([]), 'board_total' => 10, 'description' => '港內水面平靜如鏡，是新手練習拋竿與認識魚種的最佳起點。', 'vis' => json_encode(['wave' => 0, 'rock' => 1, 'cur' => 0]), 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '紅頭村前方海灘', 'rule' => 'gte', 'banned' => json_encode([6]), 'board_total' => 10, 'description' => '近岸沙地與礁石交界，水深較淺，適合全家人一起體驗。', 'vis' => json_encode(['wave' => 0, 'rock' => 1, 'cur' => 0, 'sand' => 1]), 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '椰油村開元港', 'rule' => 'gte', 'banned' => json_encode([]), 'board_total' => 10, 'description' => '交通便利且魚群穩定，適合在黃昏時刻邊聊天邊釣魚。', 'vis' => json_encode(['wave' => 0, 'rock' => 1, 'cur' => 0, 'dusk' => 1]), 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '漁人村潮間帶', 'rule' => 'gte', 'banned' => json_encode([5, 6]), 'board_total' => 10, 'description' => '潮間帶豐富的生物多樣性，雖然魚體型不大，但種類繁多。', 'vis' => json_encode(['wave' => 0, 'rock' => 2, 'cur' => 0, 'tide' => 1]), 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '朗島避風港', 'rule' => 'gte', 'banned' => json_encode([]), 'board_total' => 10, 'description' => '部落前方的避風港，提供穩定的環境，是學習分享精神的好地方。', 'vis' => json_encode(['wave' => 0, 'rock' => 1, 'cur' => 0]), 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '八代灣外緣', 'rule' => 'gte', 'banned' => json_encode([1]), 'board_total' => 7, 'description' => '這裡開始有洋流經過，需要一點技巧才能穩定魚竿。', 'vis' => json_encode(['wave' => 1, 'rock' => 1, 'cur' => 1]), 'sort' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '東清灣礁石區', 'rule' => 'gte', 'banned' => json_encode([1]), 'board_total' => 7, 'description' => '礁石縫隙中藏著好魚，但要注意魚鉤可能會掛在珊瑚礁上。', 'vis' => json_encode(['wave' => 1, 'rock' => 3, 'cur' => 0]), 'sort' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '五孔洞海域', 'rule' => 'gte', 'banned' => json_encode([1, 2]), 'board_total' => 7, 'description' => '充滿神秘傳說的地點，環境稍顯複雜，需要集中精神。', 'vis' => json_encode(['wave' => 1, 'rock' => 2, 'cur' => 1, 'cave' => 1]), 'sort' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '坦克岩周邊', 'rule' => 'gte', 'banned' => json_encode([6]), 'board_total' => 7, 'description' => '岩石結構特殊，吸引魚群聚集，是進階玩家試手氣的好去處。', 'vis' => json_encode(['wave' => 1, 'rock' => 3, 'cur' => 0]), 'sort' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '雙獅岩外海', 'rule' => 'gte', 'banned' => json_encode([1]), 'board_total' => 7, 'description' => '位於兩大岩石夾縫，水流方向不穩定，考驗玩家對海象的判斷。', 'vis' => json_encode(['wave' => 1, 'rock' => 3, 'cur' => 1]), 'sort' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '小蘭嶼黑水溝', 'rule' => 'gt', 'banned' => json_encode([1, 2, 3, 6]), 'board_total' => 5, 'description' => '黑潮主流經過，水流湍急。只有真正的勇士才能在深海中取魚。', 'vis' => json_encode(['wave' => 2, 'rock' => 1, 'cur' => 2, 'dark' => 1]), 'sort' => 10, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '青青草原崖下', 'rule' => 'gt', 'banned' => json_encode([1, 2, 6]), 'board_total' => 5, 'description' => '懸崖下方風浪大，不僅環境艱困，對心理素質也是一大挑戰。', 'vis' => json_encode(['wave' => 2, 'rock' => 2, 'cur' => 1, 'cliff' => 1]), 'sort' => 11, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '大天池下海口', 'rule' => 'gt', 'banned' => json_encode([1, 2, 6]), 'board_total' => 5, 'description' => '此處匯集山上海水，環境變化莫測，魚群警覺性極高。', 'vis' => json_encode(['wave' => 2, 'rock' => 2, 'cur' => 2]), 'sort' => 12, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '饅頭岩急流區', 'rule' => 'gt', 'banned' => json_encode([1, 2, 6]), 'board_total' => 5, 'description' => '饅頭岩旁水流極快，魚群力道猛烈，稍有不慎就會脫鉤。', 'vis' => json_encode(['wave' => 2, 'rock' => 2, 'cur' => 2, 'dome' => 1]), 'sort' => 13, 'created_at' => $now, 'updated_at' => $now],
            ['name' => '東清外海大浪區', 'rule' => 'gt', 'banned' => json_encode([1, 2, 3, 6]), 'board_total' => 5, 'description' => '面對太平洋的湧浪，每一步判定都需要戰戰兢兢，回報也最豐厚。', 'vis' => json_encode(['wave' => 3, 'rock' => 1, 'cur' => 2]), 'sort' => 14, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('destiny_cards')->insertOrIgnore([
            ['key' => 'surge', 'title' => '湧浪來襲', 'content' => '湧浪突然拍打上岸，被淋濕了', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'baitoff', 'title' => '魚餌掉了', 'content' => '魚餌沒有勾好，魚竿甩出去就掉了', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'baiteat', 'title' => '魚餌被吃了', 'content' => '魚餌被吃掉了', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 0, 'count_mid' => 0, 'count_high' => 0, 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'gearbad', 'title' => '釣具沒有準備好', 'content' => '浮標跟鉛配重錯誤，無法判別魚是否上鉤', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 0, 'count_mid' => 0, 'count_high' => 0, 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'snag', 'title' => '釣到地球了', 'content' => '魚餌被礁石卡住，需要擲骰子', 'result' => '沒有漁獲。擲骰 ≤3 魚鉤收不回來，休息一回合處理釣具', 'kind' => 'snag', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'tangle', 'title' => '跟夥伴纏線了', 'content' => '魚線跟夥伴的纏繞在一起，需要擲骰子', 'result' => '沒有漁獲。擲骰 ≤3 釣具損壞，與身旁玩家一起休息一回合', 'kind' => 'tangle', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'wind', 'title' => '風太大了', 'content' => '因為風太大，需要用骰子決定釣具是否順利入海', 'result' => '擲骰 >2 魚餌順利入海，進入拉竿階段', 'kind' => 'wind', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hooked', 'title' => '中魚了', 'content' => '有魚上鉤了，把握好機會', 'result' => '進入拉竿階段！', 'kind' => 'go', 'count_low' => 15, 'count_mid' => 14, 'count_high' => 14, 'sort' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'swallow', 'title' => '中魚了（吞鉤）', 'content' => '有魚吞鉤了，把握好機會', 'result' => '進入拉竿階段！若順利釣起，需休息一回合處理吞鉤', 'kind' => 'go_swallow', 'count_low' => 3, 'count_mid' => 3, 'count_high' => 3, 'sort' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'double', 'title' => '雙鉤中魚了', 'content' => '使用兩門魚鉤都中魚了，把握好機會', 'result' => '進入拉竿階段！若拉竿成功可額外多得 1 條（含鄰近遞補）', 'kind' => 'go_double', 'count_low' => 6, 'count_mid' => 5, 'count_high' => 7, 'sort' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'eel', 'title' => '遇到海鰻', 'content' => '海鰻會偷吃漁獲，需要用骰子決定漁獲狀態', 'result' => '擲骰 >2 保住漁獲；否則損失 1 條放回魚牌堆', 'kind' => 'eel', 'count_low' => 0, 'count_mid' => 1, 'count_high' => 0, 'sort' => 10, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'bigwave', 'title' => '大浪來襲', 'content' => '有一波浪推來了，快把腳抬高，避開浪潮', 'result' => '擲骰 >2 躲過浪潮；否則跌倒，休息一回合', 'kind' => 'bigwave', 'count_low' => 0, 'count_mid' => 1, 'count_high' => 0, 'sort' => 11, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'seen1', 'title' => '被魚發現了', 'content' => '魚線用太粗了，被魚抓包了', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 12, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'seen2', 'title' => '被魚發現了', 'content' => '站太高了，被魚抓包了', 'result' => '沒有漁獲', 'kind' => 'fail', 'count_low' => 0, 'count_mid' => 0, 'count_high' => 0, 'sort' => 13, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('action_cards')->insertOrIgnore([
            ['key' => 'hit', 'emoji' => '🎣', 'title' => '中魚了！', 'description' => '成功拉竿：進行捕獲判定。', 'flavor' => '魚兒咬餌了，現在看你的技術。', 'hooked' => json_encode(['emoji' => '💪', 'title' => '穩住！開始收線', 'desc' => '沉住氣收線：進行捕獲判定。', 'flavor' => '竿尾彎了，一收一放之間見真章。']), 'count_low' => 13, 'count_mid' => 12, 'count_high' => 12, 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'double', 'emoji' => '🎣🎣', 'title' => '雙鉤中魚！', 'description' => '強力拉竿：可拉 2 條、每條各自判定（含鄰近遞補）。', 'flavor' => '運氣極佳、技術純熟，一次吸引兩條魚上鉤。', 'hooked' => json_encode(['emoji' => '🎣🎣', 'title' => '另一門鉤也中了！', 'desc' => '收線途中另一門鉤也中魚：可拉 2 條、每條各自判定（含鄰近遞補）。', 'flavor' => '雙竿齊沉，今天海神眷顧。']), 'count_low' => 6, 'count_mid' => 6, 'count_high' => 8, 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'tangle', 'emoji' => '🪢', 'title' => '跟夥伴纏線了', 'description' => '協作失誤：與離你最近的夥伴魚線纏繞，雙方皆無漁獲。擲骰未達 3，兩人一起休息一回合。', 'flavor' => '站得越近，線越容易繞在一起。', 'hooked' => json_encode(['emoji' => '🪢', 'title' => '魚拖著線纏住夥伴！', 'desc' => '上鉤的魚亂竄，把線拖進離你最近的夥伴那裡——魚跑了，雙方皆無漁獲。擲骰未達 3，兩人一起休息一回合。', 'flavor' => '大魚一發力，兩個人的線全亂了。']), 'count_low' => 1, 'count_mid' => 1, 'count_high' => 1, 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'swallow', 'emoji' => '😮', 'title' => '吞鉤了！', 'description' => '自動捕獲：隨機取得該水域 1 張魚牌，但下回合休息。', 'flavor' => '穩拿，但處理吞鉤很費時。', 'hooked' => json_encode(['emoji' => '😮', 'title' => '魚把鉤吞得更深', 'desc' => '自動捕獲：直接取得該水域 1 張魚牌，但下回合休息處理。', 'flavor' => '連鉤帶線吞下去了，跑不掉、也急不得。']), 'count_low' => 2, 'count_mid' => 2, 'count_high' => 2, 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'baitlost', 'emoji' => '🪱', 'title' => '魚餌掉了', 'description' => '直接失敗：本次行動結束，不進行判定。', 'flavor' => '魚只吃了餌就跑了，只能重新整理釣組。', 'hooked' => json_encode(['emoji' => '💨', 'title' => '脫鉤了！', 'desc' => '魚在收線途中甩脫了魚鉤：本次行動結束，不進行判定。', 'flavor' => '就差一點！魚尾一甩，回到了大海。']), 'count_low' => 1, 'count_mid' => 2, 'count_high' => 1, 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'snag', 'emoji' => '🪨', 'title' => '釣到地球（底礁）', 'description' => '設備損壞：本次行動結束，下回合需休息處理線組。', 'flavor' => '魚鉤被礁石卡住了。', 'hooked' => json_encode(['emoji' => '🪨', 'title' => '魚鑽進礁石縫！', 'desc' => '上鉤的魚鑽進礁縫把線卡死：本次行動結束，下回合需休息處理線組。', 'flavor' => '老釣手都知道，讓魚鑽了洞就只能斷線。']), 'count_low' => 1, 'count_mid' => 1, 'count_high' => 0, 'sort' => 5, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('env_cards')->insertOrIgnore([
            ['key' => 'calm', 'emoji' => '🌅', 'title' => '風平浪靜', 'description' => '無事發生，下一回合大家都正常釣魚。', 'flavor' => '海洋寬容的一面，適合釣魚。', 'card_count' => 5, 'sort' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'eel', 'emoji' => '🐍', 'title' => '海鰻偷襲', 'description' => '海鰻爬上岸偷水窪的漁獲！每位玩家擲骰，小於 3 損失 1 條放回補充堆。', 'flavor' => '趁大家盯著海面，牠從岩縫溜了上來。', 'card_count' => 2, 'sort' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'escape', 'emoji' => '🐟💨', 'title' => '奮力逃脫', 'description' => '水窪裡的魚奮力跳出！每位玩家擲骰，小於 3 損失 1 條放回補充堆。', 'flavor' => '魚池的魚奮力逃出水池，游回大海。', 'card_count' => 2, 'sort' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hightide', 'emoji' => '🌊', 'title' => '漲潮了', 'description' => '魚群移動：場上所有魚牌重新洗牌置放。', 'flavor' => '潮水帶著魚群換了位置。', 'card_count' => 2, 'sort' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'lowtide', 'emoji' => '🏖️', 'title' => '退潮了', 'description' => '魚群移動：場上所有魚牌重新洗牌置放。', 'flavor' => '礁岩露出，魚群游向別處。', 'card_count' => 2, 'sort' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'wave', 'emoji' => '🌊💥', 'title' => '大浪打來', 'description' => '自然反撲：每位玩家擲骰，小於 3 需強制休息一回合。', 'flavor' => '大浪出現，單腳站立、避免被浪沖倒！', 'card_count' => 3, 'sort' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'chat', 'emoji' => '💬', 'title' => '風平浪靜，聊聊天吧', 'description' => '全員同步休息一回合。', 'flavor' => '海邊的閒聊，也是文化的傳承。', 'card_count' => 1, 'sort' => 6, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('game_settings')->insertOrIgnore([
            ['key' => 'rounds', 'value' => json_encode(15), 'description' => '遊戲總回合數', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'collective_goal', 'value' => json_encode(21), 'description' => '全體漁獲集體目標', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'spot_positions', 'value' => json_encode([[0.13, 0.665], [0.375, 0.695], [0.615, 0.655], [0.235, 0.475], [0.5, 0.435], [0.765, 0.41]]), 'description' => '六個隱藏機率區座標比例 [x,y]', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'random_fish_ratio', 'value' => json_encode(0.35), 'description' => '補魚時完全隨機比例', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'bgm_speedup_round', 'value' => json_encode(10), 'description' => '背景音樂開始加速的回合', 'created_at' => $now, 'updated_at' => $now],
        ]);

    }
}
