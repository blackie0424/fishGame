<?php

namespace App\Providers;

use App\Contracts\GameConfigRepositoryInterface;
use App\Repositories\EloquentGameConfigRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            GameConfigRepositoryInterface::class,
            EloquentGameConfigRepository::class
        );
    }

    public function boot(): void {}
}
