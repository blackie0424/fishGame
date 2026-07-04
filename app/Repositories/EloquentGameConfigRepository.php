<?php

namespace App\Repositories;

use App\Contracts\GameConfigRepositoryInterface;
use App\Models\ActionCard;
use App\Models\DestinyCard;
use App\Models\EnvCard;
use App\Models\FishSpecies;
use App\Models\GameSetting;
use App\Models\Role;
use App\Models\SiteCard;

class EloquentGameConfigRepository implements GameConfigRepositoryInterface
{
    public function getConfig(): array
    {
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
    }
}
