<?php

namespace Tests\Unit\Admin;

use App\Admin\EntityRegistry;
use PHPUnit\Framework\TestCase;

class EntityRegistryTest extends TestCase
{
    private const EXPECTED_ENTITIES = ['fish', 'roles', 'sites', 'destiny', 'actions', 'envs', 'settings'];

    public function test_all_returns_all_expected_entities(): void
    {
        $registry = EntityRegistry::all();

        foreach (self::EXPECTED_ENTITIES as $entity) {
            $this->assertArrayHasKey($entity, $registry);
        }
    }

    public function test_each_entity_has_required_keys(): void
    {
        foreach (EntityRegistry::all() as $key => $cfg) {
            $this->assertArrayHasKey('model', $cfg, "Entity '{$key}' missing 'model'");
            $this->assertArrayHasKey('label', $cfg, "Entity '{$key}' missing 'label'");
            $this->assertArrayHasKey('fields', $cfg, "Entity '{$key}' missing 'fields'");
            $this->assertNotEmpty($cfg['fields'], "Entity '{$key}' has empty fields");
        }
    }

    public function test_each_entity_model_class_exists(): void
    {
        foreach (EntityRegistry::all() as $key => $cfg) {
            $this->assertTrue(
                class_exists($cfg['model']),
                "Model class '{$cfg['model']}' for entity '{$key}' does not exist"
            );
        }
    }

    public function test_get_returns_correct_entity(): void
    {
        $cfg = EntityRegistry::get('fish');

        $this->assertSame(\App\Models\FishSpecies::class, $cfg['model']);
        $this->assertSame('魚牌（魚種與張數）', $cfg['label']);
    }

    public function test_get_throws_404_for_unknown_entity(): void
    {
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        EntityRegistry::get('nonexistent');
    }

    public function test_fish_entity_has_required_fields(): void
    {
        $fields = EntityRegistry::get('fish')['fields'];

        $this->assertArrayHasKey('name', $fields);
        $this->assertArrayHasKey('difficulty', $fields);
        $this->assertArrayHasKey('card_count', $fields);
        $this->assertArrayHasKey('enabled', $fields);
    }

    public function test_settings_entity_fields_have_json_type(): void
    {
        $fields = EntityRegistry::get('settings')['fields'];

        $this->assertSame('json', $fields['value']['type']);
    }
}
