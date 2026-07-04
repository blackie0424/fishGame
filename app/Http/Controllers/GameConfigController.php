<?php

namespace App\Http\Controllers;

use App\Contracts\GameConfigRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class GameConfigController extends Controller
{
    public const CACHE_KEY = 'game-config-v1';

    public function __construct(
        private GameConfigRepositoryInterface $repository
    ) {}

    public function __invoke(): JsonResponse
    {
        $config = Cache::rememberForever(self::CACHE_KEY, fn () => $this->repository->getConfig());

        return response()->json($config);
    }
}
