<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * 依 public/images/removebg/ 去背照片重新校正 20 種魚的像素圖參數。
 *
 * 舊參數多數與實魚差異極大（如 Acyod 畫成紅色，實為深藍底黃縱紋；
 * Tapez 畫成銀藍，實為鮮黃蝴蝶魚）。本次逐張目視 + 程式抽色取得
 * body/belly/acc/tail，並在 art JSON 加入 note（中文特徵描述），
 * 供後台魚種設定手動微調時參考。前端會忽略 note 等未知欄位。
 *
 * 注意：會覆寫現有 art 值（包含先前 AI 分析結果）——照片校正值即為新基準。
 */
return new class extends Migration
{
    /** 照片校正後的像素圖參數（名稱對應 fish_species.name） */
    private const ART = [
        'Acyod'     => ['shape' => 'deep', 'body' => '#2c4468', 'belly' => '#c8b4c4', 'acc' => '#e0a030', 'pat' => 'hline', 'tail' => '#141c2c', 'note' => '藍紋倒吊：深藍底滿身黃色縱紋，腹部淡粉白，尾鰭黑色帶藍邊'],
        'Amingang'  => ['shape' => 'oval', 'body' => '#c87888', 'belly' => '#eec6cc', 'acc' => '#8a4a58', 'pat' => 'plain', 'note' => '鬚哥（秋姑）：全身玫瑰粉紅、腹部淡粉，下巴有觸鬚'],
        'Angsa'     => ['shape' => 'deep', 'body' => '#3c3833', 'belly' => '#625a4e', 'acc' => '#1e1c1a', 'pat' => 'plain', 'note' => '厚身刺尾鯛體型，整體深褐黑色'],
        'Anid'      => ['shape' => 'oval', 'body' => '#d0bca4', 'belly' => '#ece4d8', 'acc' => '#7a5640', 'pat' => 'spots', 'note' => '石斑：米白底密布褐色豹斑'],
        'Arawa'     => ['shape' => 'long', 'body' => '#3c7058', 'belly' => '#8ab07c', 'acc' => '#7a4e30', 'pat' => 'plain', 'tail' => '#3e6e9e', 'note' => '鸚哥：身體綠色、背側古銅褐、尾鰭藍色'],
        'Cilat'     => ['shape' => 'deep', 'body' => '#c6c2a2', 'belly' => '#eeeadc', 'acc' => '#4c5668', 'pat' => 'spots', 'note' => '鰺科體型：銀白帶橄欖黃、身上細黑點、背側深藍灰、尾鰭分叉'],
        'Cirow'     => ['shape' => 'oval', 'body' => '#322e32', 'belly' => '#9a94a0', 'acc' => '#16141a', 'pat' => 'plain', 'note' => '黑褐色魚體、腹側銀灰（照片腹部紅色為反光，非體色）'],
        'Ilek'      => ['shape' => 'oval', 'body' => '#9aa2a8', 'belly' => '#d6dade', 'acc' => '#4e565e', 'pat' => 'plain', 'note' => '白毛：銀灰色、背側深灰、尾鰭深色分叉'],
        'Kosikosi'  => ['shape' => 'long', 'body' => '#a8b8c8', 'belly' => '#dde4ea', 'acc' => '#1c1e22', 'pat' => 'plain', 'tail' => '#24262a', 'note' => '銀藍色細長身，尾鰭黑白橫帶醒目（像素圖以深色尾表現）'],
        'Kowaos'    => ['shape' => 'long', 'body' => '#a4b49c', 'belly' => '#d6dcd0', 'acc' => '#8a5040', 'pat' => 'spots', 'note' => '隆頭魚：綠灰底紅褐網格斑，頭部帶粉綠條紋'],
        'Kozapo'    => ['shape' => 'deep', 'body' => '#d6c6b0', 'belly' => '#eee8da', 'acc' => '#965e48', 'pat' => 'spots', 'note' => '石狗公：米白底紅褐雲斑，背鰭多棘'],
        'Lagarow'   => ['shape' => 'long', 'body' => '#55985e', 'belly' => '#c4dc74', 'acc' => '#d84a5e', 'pat' => 'hline', 'tail' => '#c04858', 'note' => '彩色隆頭魚：綠底紅粉縱紋、腹部黃綠、尾鰭偏紅'],
        'Lalavok'   => ['shape' => 'deep', 'body' => '#b8bcb2', 'belly' => '#eeece4', 'acc' => '#56504a', 'pat' => 'plain', 'tail' => '#4e5a6c', 'note' => '豆娘體型：淡銀白、背部深褐、尾鰭深藍灰（非黃色）'],
        'Mahabteng' => ['shape' => 'deep', 'body' => '#585c50', 'belly' => '#888c7e', 'acc' => '#2c302a', 'pat' => 'bars', 'note' => '厚身魚：橄欖灰底深色縱帶'],
        'Malan'     => ['shape' => 'deep', 'body' => '#7ecec0', 'belly' => '#d6efe6', 'acc' => '#1c2226', 'pat' => 'bars', 'tail' => '#2c3238', 'note' => '雀鯛：藍綠色、黑色縱帶、背側帶黃暈、尾鰭深色'],
        'Savali'    => ['shape' => 'deep', 'body' => '#d6b678', 'belly' => '#f0eade', 'acc' => '#18181c', 'pat' => 'plain', 'tail' => '#b4b0a4', 'note' => '畢卡索砲彈魚：上身砂黃、腹白，體側大塊黑斑與黃綠細線（黑斑超出現有花紋能力）'],
        'Takazit'   => ['shape' => 'long', 'body' => '#20362a', 'belly' => '#30503c', 'acc' => '#101a14', 'pat' => 'plain', 'tail' => '#bed676', 'note' => '鳥鸚鯛：墨綠色長吻，尾鰭邊緣黃綠'],
        'Tangara'   => ['shape' => 'deep', 'body' => '#4a3c34', 'belly' => '#6e5c50', 'acc' => '#28201a', 'pat' => 'plain', 'note' => '厚身雀鯛：深巧克力褐、鱗紋細密（非橘紅色）'],
        'Tapez'     => ['shape' => 'deep', 'body' => '#e6c322', 'belly' => '#f0d84a', 'acc' => '#3a3222', 'pat' => 'spots', 'tail' => '#c89858', 'note' => '蝴蝶魚：鮮黃底多排深色點紋，頭部黑白眼帶'],
        'Veras'     => ['shape' => 'long', 'body' => '#b6cac2', 'belly' => '#daeee6', 'acc' => '#3c4a4e', 'pat' => 'spots', 'tail' => '#d8882e', 'note' => '棋盤格紋隆頭魚：淡青底深色鱗斑、頭部綠粉紋、尾鰭橘色'],
    ];

    public function up(): void
    {
        foreach (self::ART as $name => $art) {
            DB::table('fish_species')->where('name', $name)->update([
                'art' => json_encode($art, JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // 資料校正不可逆（覆寫前值未保存）；如需回復請由備份還原
    }
};
