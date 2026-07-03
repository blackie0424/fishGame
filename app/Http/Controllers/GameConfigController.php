<?php

namespace App\Http\Controllers;

use App\Models\ActionCard;
use App\Models\DestinyCard;
use App\Models\EnvCard;
use App\Models\FishSpecies;
use App\Models\GameSetting;
use App\Models\Role;
use App\Models\SiteCard;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * 提供前端遊戲的完整動態設定。
 * 後台任何異動（透過 Admin CRUD）都會清除快取，遊戲重新整理即生效。
 */
class GameConfigController extends Controller
{
    public const CACHE_KEY = 'game-config-v1';

    public function __invoke(): JsonResponse
    {
        $config = Cache::rememberForever(self::CACHE_KEY, function () {
            return [
                'fish' => FishSpecies::where('enabled', true)->orderBy('sort')
                    ->get(['name', 'category', 'difficulty', 'card_count', 'art']),
                'roles' => Role::where('enabled', true)->orderBy('sort')
                    ->get(['name', 'emoji', 'need', 'targets', 'description', 'skin', 'cloth']),
                'sites' => SiteCard::where('enabled', true)->orderBy('sort')
                    ->get(['name', 'rule', 'banned', 'board_total', 'description', 'vis']),
                'destiny' => DestinyCard::where('enabled', true)->orderBy('sort')
                    ->get(['key', 'title', 'content', 'result', 'kind', 'count_low', 'count_mid', 'count_high']),
                'actions' => ActionCard::where('enabled', true)->orderBy('sort')
                    ->get(['key', 'emoji', 'title', 'description', 'flavor', 'hooked', 'count_low', 'count_mid', 'count_high']),
                'envs' => EnvCard::where('enabled', true)->orderBy('sort')
                    ->get(['key', 'emoji', 'title', 'description', 'flavor', 'card_count']),
                'settings' => GameSetting::pluck('value', 'key'),
            ];
        });

        return response()->json($config);
    }
}
