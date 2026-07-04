<?php

namespace Tests\Feature;

use App\Http\Controllers\GameConfigController;
use App\Models\FishSpecies;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GameConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_config_endpoint_returns_200_with_json(): void
    {
        $response = $this->getJson('/api/game-config');

        $response->assertStatus(200)
            ->assertJsonStructure(['fish', 'roles', 'sites', 'destiny', 'actions', 'envs', 'settings']);
    }

    public function test_config_only_includes_enabled_fish(): void
    {
        FishSpecies::create([
            'name' => 'EnabledFish', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 2, 'art' => ['shape' => 'a'], 'enabled' => true,
        ]);
        FishSpecies::create([
            'name' => 'DisabledFish', 'category' => 'Oyod', 'difficulty' => 2,
            'card_count' => 1, 'art' => ['shape' => 'b'], 'enabled' => false,
        ]);

        $response = $this->getJson('/api/game-config');

        $fish = $response->json('fish');
        $names = array_column($fish, 'name');
        $this->assertContains('EnabledFish', $names);
        $this->assertNotContains('DisabledFish', $names);
    }

    public function test_config_fish_sorted_by_sort_column(): void
    {
        FishSpecies::create([
            'name' => 'B_Fish', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 1, 'art' => ['shape' => 'a'], 'sort' => 2,
        ]);
        FishSpecies::create([
            'name' => 'A_Fish', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 1, 'art' => ['shape' => 'b'], 'sort' => 1,
        ]);

        $response = $this->getJson('/api/game-config');

        $fish = $response->json('fish');
        $this->assertSame('A_Fish', $fish[0]['name']);
        $this->assertSame('B_Fish', $fish[1]['name']);
    }

    public function test_config_is_cached_after_first_request(): void
    {
        $this->assertFalse(Cache::has(GameConfigController::CACHE_KEY));

        $this->getJson('/api/game-config');

        $this->assertTrue(Cache::has(GameConfigController::CACHE_KEY));
    }

    public function test_cache_is_cleared_after_admin_save(): void
    {
        config(['app.admin_password' => 'testpass']);
        Cache::put(GameConfigController::CACHE_KEY, 'stale-data');

        $this->withSession(['is_admin' => true])->post('/admin/fish/save', [
            'name'       => 'NewFish',
            'category'   => 'Rahet',
            'difficulty' => 2,
            'card_count' => 3,
            'art'        => '{"shape":"c"}',
        ]);

        $this->assertFalse(Cache::has(GameConfigController::CACHE_KEY));
    }

    public function test_config_returns_all_seven_keys(): void
    {
        $response = $this->getJson('/api/game-config');

        $data = $response->json();
        $this->assertCount(7, $data);
        foreach (['fish', 'roles', 'sites', 'destiny', 'actions', 'envs', 'settings'] as $key) {
            $this->assertArrayHasKey($key, $data);
        }
    }

    public function test_config_only_includes_enabled_roles(): void
    {
        Role::create([
            'name' => 'ActiveRole', 'need' => 3, 'description' => 'Desc',
            'skin' => '#fff', 'cloth' => '#000', 'enabled' => true,
        ]);
        Role::create([
            'name' => 'InactiveRole', 'need' => 1, 'description' => 'Desc',
            'skin' => '#fff', 'cloth' => '#000', 'enabled' => false,
        ]);

        $response = $this->getJson('/api/game-config');

        $roles = $response->json('roles');
        $names = array_column($roles, 'name');
        $this->assertContains('ActiveRole', $names);
        $this->assertNotContains('InactiveRole', $names);
    }
}
