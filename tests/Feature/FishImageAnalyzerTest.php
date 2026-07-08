<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * AI 圖片分析全情境回歸測試（對應 2026-07 事故：gemini-2.5-flash 思考模型
 * thought parts / 巢狀 JSON 污染 / safety 無明確訊息 / 429、503 不重試）。
 * 以 Http::fake 模擬 Gemini 回應形狀，不需真實金鑰。
 */
class FishImageAnalyzerTest extends TestCase
{
    private function png(): UploadedFile
    {
        return UploadedFile::fake()->image('fish.png', 10, 10);
    }

    private function post(array $extra = [])
    {
        return $this->withSession(['admin_authed' => true])
            ->post(route('admin.fish.analyze'), array_merge(['image' => $this->png()], $extra));
    }

    private function gemini(array $body, int $status = 200): void
    {
        config(['services.google_ai.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($body, $status)]);
    }

    private function okBody(string $text): array
    {
        return ['candidates' => [['content' => ['parts' => [['text' => $text]]], 'finishReason' => 'STOP']]];
    }

    private const FLAT = '{"shape":"oval","body":"#3a8a5c","belly":"#dfeee2","acc":"#c1272d","pat":"spots"}';

    public function test_正常_JSON_回應成功解析(): void
    {
        $this->gemini($this->okBody(self::FLAT));
        $this->post()->assertOk()->assertJsonPath('art.shape', 'oval');
    }

    public function test_思考模型_thought_parts_不會蓋掉答案(): void
    {
        config(['services.google_ai.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [
                ['thought' => true, 'text' => '先觀察 {形狀為橢圓} 的魚體…'],
                ['text' => self::FLAT],
            ]], 'finishReason' => 'STOP']],
        ])]);
        $this->post()->assertOk()->assertJsonPath('art.shape', 'oval');
    }

    public function test_deep_形狀是合法值_對齊前端渲染器(): void
    {
        // 前端 drawFish 支援 oval/long/deep 三種形狀（Acyod、Cilat、Tapez 等厚身魚用 deep），
        // 白名單漏掉 deep 會讓 AI 回傳的厚身魚形狀被丟棄 → 解析失敗
        $deep = '{"shape":"deep","body":"#2c4468","belly":"#c8b4c4","acc":"#e0a030","pat":"hline"}';
        $this->gemini($this->okBody($deep));
        $this->post()->assertOk()->assertJsonPath('art.shape', 'deep');
    }

    public function test_巢狀_JSON_不會污染_art_僅保留白名單欄位(): void
    {
        $nested = '{"shape":"oval","body":"#3a8a5c","belly":"#dfeee2","acc":"#c1272d","pat":"spots","meta":{"confidence":0.92}}';
        $this->gemini($this->okBody($nested));
        $res = $this->post()->assertOk();
        $res->assertJsonPath('art.shape', 'oval');
        $res->assertJsonMissingPath('art.meta');
    }

    public function test_safety_阻擋_回傳明確訊息(): void
    {
        $this->gemini(['promptFeedback' => ['blockReason' => 'SAFETY']]);
        $this->post()->assertStatus(422)->assertJsonFragment(['error' => 'AI 拒絕分析這張圖片（SAFETY），請換一張照片。']);
    }

    public function test_503_過載自動重試後成功(): void
    {
        config(['services.google_ai.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()
            ->push(['error' => ['message' => 'overloaded']], 503)
            ->push(['error' => ['message' => 'overloaded']], 503)
            ->push($this->okBody(self::FLAT), 200)]);
        $this->post()->assertOk()->assertJsonPath('art.pat', 'spots');
    }

    public function test_金鑰無效_帶出上游訊息(): void
    {
        $this->gemini(['error' => ['message' => 'API key not valid. Please pass a valid API key.']], 400);
        $this->post()->assertStatus(503)->assertJsonFragment([
            'error' => 'AI 服務錯誤（HTTP 400）：API key not valid. Please pass a valid API key.',
        ]);
    }

    public function test_被長度上限截斷_提示明確原因(): void
    {
        config(['services.google_ai.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => '{"shape":"ova']]], 'finishReason' => 'MAX_TOKENS']],
        ])]);
        $this->post()->assertStatus(422)->assertJsonFragment(['error' => '無法解析 AI 回應（回應被長度上限截斷），請重試。']);
    }

    public function test_未設定金鑰_回_422(): void
    {
        config(['services.google_ai.key' => null]);
        $this->post()->assertStatus(422);
    }

    public function test_請求帶入_JSON_模式與關閉思考(): void
    {
        $this->gemini($this->okBody(self::FLAT));
        $this->post()->assertOk();
        Http::assertSent(function ($request) {
            $g = $request->data()['generationConfig'] ?? [];
            return ($g['responseMimeType'] ?? '') === 'application/json'
                && ($g['thinkingConfig']['thinkingBudget'] ?? null) === 0;
        });
    }
}
