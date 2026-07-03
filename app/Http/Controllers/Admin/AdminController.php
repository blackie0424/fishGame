<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\GameConfigController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * 註冊表驅動的後台 CRUD：一套控制器管理所有遊戲項目。
 * 每個實體定義 model、顯示欄位與表單欄位（型別決定輸入元件與驗證）。
 */
class AdminController extends Controller
{
    /** @return array<string, array{model:class-string, label:string, fields:array}> */
    public static function registry(): array
    {
        return [
            'fish' => [
                'model' => \App\Models\FishSpecies::class,
                'label' => '魚牌（魚種與張數）',
                'fields' => [
                    'name'       => ['label' => '魚名', 'type' => 'text', 'rules' => 'required|string|max:32'],
                    'category'   => ['label' => '分類 Rahet/Oyod', 'type' => 'text', 'rules' => 'required|string|max:16'],
                    'difficulty' => ['label' => '難度(1-5)', 'type' => 'number', 'rules' => 'required|integer|min:1|max:5'],
                    'card_count' => ['label' => '張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:20'],
                    'art'        => ['label' => '像素圖參數(JSON)', 'type' => 'json', 'rules' => 'required|json'],
                    'enabled'    => ['label' => '啟用', 'type' => 'bool'],
                    'sort'       => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'roles' => [
                'model' => \App\Models\Role::class,
                'label' => '角色',
                'fields' => [
                    'name'        => ['label' => '名稱', 'type' => 'text', 'rules' => 'required|string|max:32'],
                    'emoji'       => ['label' => 'Emoji', 'type' => 'text', 'rules' => 'nullable|string|max:16'],
                    'need'        => ['label' => '至少幾條魚', 'type' => 'number', 'rules' => 'required|integer|min:0|max:20'],
                    'targets'     => ['label' => '目標魚(JSON 陣列，可空)', 'type' => 'json', 'rules' => 'nullable|json'],
                    'description' => ['label' => '勝利條件描述', 'type' => 'text', 'rules' => 'required|string'],
                    'skin'        => ['label' => '膚色(hex)', 'type' => 'color', 'rules' => 'required|string|max:9'],
                    'cloth'       => ['label' => '服色(hex)', 'type' => 'color', 'rules' => 'required|string|max:9'],
                    'enabled'     => ['label' => '啟用', 'type' => 'bool'],
                    'sort'        => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'sites' => [
                'model' => \App\Models\SiteCard::class,
                'label' => '場地卡',
                'fields' => [
                    'name'        => ['label' => '場地名稱', 'type' => 'text', 'rules' => 'required|string|max:64'],
                    'rule'        => ['label' => '判定邏輯', 'type' => 'select', 'options' => ['gte' => '骰 ≥ 魚難度', 'gt' => '骰 > 魚難度'], 'rules' => 'required|in:gte,gt'],
                    'banned'      => ['label' => '限制點位(JSON，如 [1,2,6])', 'type' => 'json', 'rules' => 'required|json'],
                    'board_total' => ['label' => '場上固定魚牌總數', 'type' => 'number', 'rules' => 'required|integer|min:1|max:30'],
                    'description' => ['label' => '場地描述', 'type' => 'text', 'rules' => 'required|string'],
                    'vis'         => ['label' => '場景視覺(JSON)', 'type' => 'json', 'rules' => 'required|json'],
                    'enabled'     => ['label' => '啟用', 'type' => 'bool'],
                    'sort'        => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'destiny' => [
                'model' => \App\Models\DestinyCard::class,
                'label' => '命運卡',
                'fields' => [
                    'key'        => ['label' => '代碼(對應動畫)', 'type' => 'text', 'rules' => 'required|string|max:24'],
                    'title'      => ['label' => '標題', 'type' => 'text', 'rules' => 'required|string|max:64'],
                    'content'    => ['label' => '內容敘述', 'type' => 'text', 'rules' => 'required|string'],
                    'result'     => ['label' => '結果敘述', 'type' => 'text', 'rules' => 'required|string'],
                    'kind'       => ['label' => '機制類型', 'type' => 'select', 'options' => ['fail' => '沒有漁獲', 'snag' => '釣到地球', 'tangle' => '纏線', 'wind' => '風太大', 'eel' => '海鰻', 'bigwave' => '大浪', 'go' => '中魚(進拉竿)', 'go_swallow' => '吞鉤(進拉竿)', 'go_double' => '雙鉤(進拉竿)'], 'rules' => 'required|string|max:24'],
                    'count_low'  => ['label' => '低難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:30'],
                    'count_mid'  => ['label' => '中難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:30'],
                    'count_high' => ['label' => '高難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:30'],
                    'enabled'    => ['label' => '啟用', 'type' => 'bool'],
                    'sort'       => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'actions' => [
                'model' => \App\Models\ActionCard::class,
                'label' => '拉竿卡',
                'fields' => [
                    'key'         => ['label' => '代碼', 'type' => 'text', 'rules' => 'required|string|max:24'],
                    'emoji'       => ['label' => 'Emoji', 'type' => 'text', 'rules' => 'nullable|string|max:16'],
                    'title'       => ['label' => '標題', 'type' => 'text', 'rules' => 'required|string|max:64'],
                    'description' => ['label' => '效果敘述', 'type' => 'text', 'rules' => 'required|string'],
                    'flavor'      => ['label' => '風味文字', 'type' => 'text', 'rules' => 'required|string'],
                    'hooked'      => ['label' => '上鉤語境文案(JSON)', 'type' => 'json', 'rules' => 'nullable|json'],
                    'count_low'   => ['label' => '低難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:24'],
                    'count_mid'   => ['label' => '中難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:24'],
                    'count_high'  => ['label' => '高難度張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:24'],
                    'enabled'     => ['label' => '啟用', 'type' => 'bool'],
                    'sort'        => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'envs' => [
                'model' => \App\Models\EnvCard::class,
                'label' => '自然的反撲',
                'fields' => [
                    'key'         => ['label' => '代碼(對應動畫)', 'type' => 'text', 'rules' => 'required|string|max:24'],
                    'emoji'       => ['label' => 'Emoji', 'type' => 'text', 'rules' => 'nullable|string|max:16'],
                    'title'       => ['label' => '標題', 'type' => 'text', 'rules' => 'required|string|max:64'],
                    'description' => ['label' => '效果敘述', 'type' => 'text', 'rules' => 'required|string'],
                    'flavor'      => ['label' => '風味文字', 'type' => 'text', 'rules' => 'required|string'],
                    'card_count'  => ['label' => '張數', 'type' => 'number', 'rules' => 'required|integer|min:0|max:20'],
                    'enabled'     => ['label' => '啟用', 'type' => 'bool'],
                    'sort'        => ['label' => '排序', 'type' => 'number', 'rules' => 'integer'],
                ],
            ],
            'settings' => [
                'model' => \App\Models\GameSetting::class,
                'label' => '遊戲設定',
                'fields' => [
                    'key'         => ['label' => '設定鍵', 'type' => 'text', 'rules' => 'required|string|max:48'],
                    'value'       => ['label' => '值(JSON)', 'type' => 'json', 'rules' => 'required|json'],
                    'description' => ['label' => '說明', 'type' => 'text', 'rules' => 'nullable|string'],
                ],
            ],
        ];
    }

    protected function entity(string $entity): array
    {
        $registry = self::registry();
        abort_unless(isset($registry[$entity]), 404);

        return $registry[$entity];
    }

    public function dashboard()
    {
        $stats = collect(self::registry())->map(
            fn ($cfg, $key) => ['label' => $cfg['label'], 'count' => $cfg['model']::count()]
        );

        return view('admin.dashboard', compact('stats'));
    }

    public function index(string $entity)
    {
        $cfg = $this->entity($entity);
        $rows = $cfg['model']::orderBy($cfg['model'] === \App\Models\GameSetting::class ? 'id' : 'sort')->get();

        return view('admin.index', ['entity' => $entity, 'cfg' => $cfg, 'rows' => $rows]);
    }

    public function edit(string $entity, int $id = 0)
    {
        $cfg = $this->entity($entity);
        $row = $id ? $cfg['model']::findOrFail($id) : new $cfg['model']();

        return view('admin.edit', ['entity' => $entity, 'cfg' => $cfg, 'row' => $row]);
    }

    public function save(Request $request, string $entity, int $id = 0)
    {
        $cfg = $this->entity($entity);
        $rules = collect($cfg['fields'])
            ->filter(fn ($f) => isset($f['rules']))
            ->map(fn ($f) => $f['rules'])->all();
        $data = $request->validate($rules);

        foreach ($cfg['fields'] as $name => $f) {
            if ($f['type'] === 'bool') {
                $data[$name] = $request->boolean($name);
            } elseif ($f['type'] === 'json' && array_key_exists($name, $data)) {
                $data[$name] = $data[$name] === null || $data[$name] === '' ? null : json_decode($data[$name], true);
            }
        }

        $row = $id ? $cfg['model']::findOrFail($id) : new $cfg['model']();
        $row->fill($data)->save();

        Cache::forget(GameConfigController::CACHE_KEY);   // 讓遊戲端立即取得新設定

        return redirect()->route('admin.index', $entity)->with('ok', '已儲存，遊戲端重新整理即生效。');
    }

    public function destroy(string $entity, int $id)
    {
        $cfg = $this->entity($entity);
        $cfg['model']::findOrFail($id)->delete();
        Cache::forget(GameConfigController::CACHE_KEY);

        return redirect()->route('admin.index', $entity)->with('ok', '已刪除。');
    }
}
