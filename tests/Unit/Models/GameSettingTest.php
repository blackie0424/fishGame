<?php

namespace Tests\Unit\Models;

use App\Models\GameSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_val_returns_value_for_existing_key(): void
    {
        GameSetting::create(['key' => 'rounds', 'value' => 5]);

        $this->assertSame(5, GameSetting::val('rounds'));
    }

    public function test_val_returns_default_when_key_not_found(): void
    {
        $this->assertNull(GameSetting::val('nonexistent'));
        $this->assertSame(10, GameSetting::val('nonexistent', 10));
    }

    public function test_value_is_cast_to_array_for_json(): void
    {
        GameSetting::create(['key' => 'positions', 'value' => [1, 2, 3]]);

        $setting = GameSetting::where('key', 'positions')->first();

        $this->assertIsArray($setting->value);
        $this->assertSame([1, 2, 3], $setting->value);
    }
}
