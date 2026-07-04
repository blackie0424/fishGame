<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FishImageAnalyzerTest extends TestCase
{
    use RefreshDatabase;

    private function asAdmin(): static
    {
        return $this->withSession(['is_admin' => true]);
    }

    private function fakeSuccessResponse(array $art = []): void
    {
        $art = array_merge([
            'shape' => 'oval',
            'body'  => '#3a8a5c',
            'belly' => '#7fd4a8',
            'acc'   => '#1a4a2c',
            'pat'   => 'spots',
        ], $art);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => json_encode($art)]]],
                ]],
            ], 200),
        ]);
    }

    // ── Auth ──────────────────────────────────────────────────

    public function test_requires_admin_auth(): void
    {
        $image = UploadedFile::fake()->image('fish.jpg');

        $this->post(route('admin.fish.analyze'), ['image' => $image])
            ->assertRedirect(route('admin.login'));
    }

    // ── Validation ────────────────────────────────────────────

    public function test_image_is_required(): void
    {
        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_rejects_non_image_file(): void
    {
        $file = UploadedFile::fake()->create('fish.pdf', 100, 'application/pdf');

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_rejects_file_over_5mb(): void
    {
        $file = UploadedFile::fake()->image('fish.jpg')->size(5121);

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }

    public function test_rejects_description_over_500_chars(): void
    {
        $this->fakeSuccessResponse();
        $image = UploadedFile::fake()->image('fish.jpg');

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), [
                'image'       => $image,
                'description' => str_repeat('x', 501),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('description');
    }

    // ── Success ───────────────────────────────────────────────

    public function test_returns_art_on_success(): void
    {
        $this->fakeSuccessResponse();
        $image = UploadedFile::fake()->image('fish.jpg');

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $image])
            ->assertOk()
            ->assertJsonStructure(['art' => ['shape', 'body', 'belly', 'acc', 'pat']]);
    }

    public function test_accepts_optional_description(): void
    {
        $this->fakeSuccessResponse(['pat' => 'bars']);
        $image = UploadedFile::fake()->image('fish.jpg');

        $response = $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), [
                'image'       => $image,
                'description' => '有明顯橫紋',
            ])
            ->assertOk();

        $this->assertSame('bars', $response->json('art.pat'));
    }

    public function test_returns_optional_fields_when_present(): void
    {
        $this->fakeSuccessResponse(['bigEye' => true, 'tail' => '#ffcc00']);
        $image = UploadedFile::fake()->image('fish.jpg');

        $response = $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $image])
            ->assertOk();

        $this->assertTrue($response->json('art.bigEye'));
        $this->assertSame('#ffcc00', $response->json('art.tail'));
    }

    // ── API failure ───────────────────────────────────────────

    public function test_returns_503_when_api_fails(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([], 500),
        ]);
        $image = UploadedFile::fake()->image('fish.jpg');

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $image])
            ->assertStatus(503)
            ->assertJsonFragment(['error' => 'AI 服務暫時無法使用，請稍後再試。']);
    }

    public function test_returns_422_when_response_has_no_json(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => '無法辨識這張圖片']]],
                ]],
            ], 200),
        ]);
        $image = UploadedFile::fake()->image('fish.jpg');

        $this->asAdmin()
            ->postJson(route('admin.fish.analyze'), ['image' => $image])
            ->assertStatus(422)
            ->assertJsonFragment(['error' => '無法解析 AI 回應，請重試。']);
    }
}
