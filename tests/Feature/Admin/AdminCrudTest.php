<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\GameConfigController;
use App\Models\FishSpecies;
use App\Models\GameSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private function asAdmin(): static
    {
        return $this->withSession(['is_admin' => true]);
    }

    // ── Dashboard ──────────────────────────────────────────

    public function test_dashboard_requires_auth(): void
    {
        $this->get('/admin/')->assertRedirect(route('admin.login'));
    }

    public function test_dashboard_shows_entity_stats(): void
    {
        FishSpecies::create([
            'name' => 'Ilek', 'category' => 'Rahet', 'difficulty' => 2,
            'card_count' => 4, 'art' => ['shape' => 'a'],
        ]);

        $response = $this->asAdmin()->get('/admin/');

        $response->assertStatus(200);
        $response->assertSee('魚牌');
    }

    // ── Index ──────────────────────────────────────────────

    public function test_index_lists_fish_entity(): void
    {
        FishSpecies::create([
            'name' => 'Tangara', 'category' => 'Oyod', 'difficulty' => 3,
            'card_count' => 2, 'art' => ['shape' => 'b'],
        ]);

        $response = $this->asAdmin()->get('/admin/fish');

        $response->assertStatus(200);
        $response->assertSee('Tangara');
    }

    public function test_index_returns_404_for_unknown_entity(): void
    {
        $this->asAdmin()->get('/admin/unknown')->assertStatus(404);
    }

    // ── Edit / Create ──────────────────────────────────────

    public function test_create_form_is_accessible(): void
    {
        $this->asAdmin()->get('/admin/fish/create')->assertStatus(200);
    }

    public function test_edit_form_loads_existing_record(): void
    {
        $fish = FishSpecies::create([
            'name' => 'Malan', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 3, 'art' => ['shape' => 'c'],
        ]);

        $response = $this->asAdmin()->get("/admin/fish/{$fish->id}/edit");

        $response->assertStatus(200);
        $response->assertSee('Malan');
    }

    // ── Save (Create) ──────────────────────────────────────

    public function test_save_creates_new_fish_and_clears_cache(): void
    {
        Cache::put(GameConfigController::CACHE_KEY, 'stale');

        $response = $this->asAdmin()->post('/admin/fish/save', [
            'name'       => 'Cirow',
            'category'   => 'Oyod',
            'difficulty' => 2,
            'card_count' => 3,
            'art'        => '{"shape":"d"}',
        ]);

        $response->assertRedirect(route('admin.index', 'fish'));
        $this->assertDatabaseHas('fish_species', ['name' => 'Cirow']);
        $this->assertFalse(Cache::has(GameConfigController::CACHE_KEY));
    }

    public function test_save_fails_validation_when_required_field_missing(): void
    {
        $response = $this->asAdmin()->post('/admin/fish/save', [
            'category'   => 'Oyod',
            'difficulty' => 2,
            'card_count' => 3,
            'art'        => '{"shape":"d"}',
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseEmpty('fish_species');
    }

    public function test_save_validates_difficulty_range(): void
    {
        $response = $this->asAdmin()->post('/admin/fish/save', [
            'name'       => 'TestFish',
            'category'   => 'Oyod',
            'difficulty' => 10,
            'card_count' => 3,
            'art'        => '{"shape":"d"}',
        ]);

        $response->assertSessionHasErrors('difficulty');
    }

    // ── Save (Update) ──────────────────────────────────────

    public function test_save_updates_existing_record(): void
    {
        $fish = FishSpecies::create([
            'name' => 'OldName', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 2, 'art' => ['shape' => 'e'],
        ]);

        $this->asAdmin()->post("/admin/fish/save/{$fish->id}", [
            'name'       => 'NewName',
            'category'   => 'Rahet',
            'difficulty' => 1,
            'card_count' => 2,
            'art'        => '{"shape":"e"}',
        ]);

        $this->assertDatabaseHas('fish_species', ['id' => $fish->id, 'name' => 'NewName']);
        $this->assertDatabaseMissing('fish_species', ['name' => 'OldName']);
    }

    public function test_save_handles_bool_field_correctly(): void
    {
        $this->asAdmin()->post('/admin/fish/save', [
            'name'       => 'Arawa',
            'category'   => 'Oyod',
            'difficulty' => 2,
            'card_count' => 1,
            'art'        => '{"shape":"f"}',
            'enabled'    => '1',
        ]);

        $fish = FishSpecies::where('name', 'Arawa')->first();
        $this->assertTrue($fish->enabled);
    }

    public function test_save_game_setting_decodes_json_value(): void
    {
        $this->asAdmin()->post('/admin/settings/save', [
            'key'   => 'rounds',
            'value' => '5',
        ]);

        $setting = GameSetting::where('key', 'rounds')->first();
        $this->assertSame(5, $setting->value);
    }

    // ── Destroy ───────────────────────────────────────────

    public function test_destroy_deletes_record_and_clears_cache(): void
    {
        Cache::put(GameConfigController::CACHE_KEY, 'stale');

        $fish = FishSpecies::create([
            'name' => 'ToDelete', 'category' => 'Rahet', 'difficulty' => 1,
            'card_count' => 1, 'art' => ['shape' => 'g'],
        ]);

        $response = $this->asAdmin()->post("/admin/fish/{$fish->id}/delete");

        $response->assertRedirect(route('admin.index', 'fish'));
        $this->assertDatabaseMissing('fish_species', ['id' => $fish->id]);
        $this->assertFalse(Cache::has(GameConfigController::CACHE_KEY));
    }

    public function test_destroy_returns_404_for_nonexistent_record(): void
    {
        $this->asAdmin()->post('/admin/fish/999/delete')->assertStatus(404);
    }
}
