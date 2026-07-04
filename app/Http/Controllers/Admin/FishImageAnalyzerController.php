<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FishImageAnalyzerController extends Controller
{
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'image'       => 'required|image|max:5120',
            'description' => 'nullable|string|max:500',
        ]);

        $imageData = base64_encode(file_get_contents($request->file('image')->path()));
        $mimeType  = $request->file('image')->getMimeType();

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-opus-4-7',
            'max_tokens' => 512,
            'messages'   => [[
                'role'    => 'user',
                'content' => [
                    [
                        'type'   => 'image',
                        'source' => [
                            'type'       => 'base64',
                            'media_type' => $mimeType,
                            'data'       => $imageData,
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => $this->buildPrompt($request->input('description', '')),
                    ],
                ],
            ]],
        ]);

        if ($response->failed()) {
            return response()->json(['error' => 'AI 服務暫時無法使用，請稍後再試。'], 503);
        }

        $text = $response->json('content.0.text', '');

        preg_match('/\{[^{}]*\}/s', $text, $matches);
        if (empty($matches[0])) {
            return response()->json(['error' => '無法解析 AI 回應，請重試。'], 422);
        }

        $art = json_decode($matches[0], true);
        if (!$art) {
            return response()->json(['error' => '回應格式錯誤，請重試。'], 422);
        }

        return response()->json(['art' => $art]);
    }

    private function buildPrompt(string $description): string
    {
        $extra = $description ? "\n使用者補充說明：{$description}" : '';

        return <<<PROMPT
請分析這張魚類圖片，輸出用於像素圖生成的 JSON 參數。

必填欄位：
- shape：魚體形狀，只能是 "oval"（橢圓）或 "long"（細長）
- body：魚身主色，十六進位色碼（如 "#3a8a5c"）
- belly：腹部較淺色，十六進位色碼
- acc：魚鰭或花紋強調色，十六進位色碼
- pat：花紋類型，只能是 "plain"（無紋）、"spots"（圓點）、"bars"（縱條）、"hline"（橫線）

選填欄位（有明顯特徵才加）：
- bigEye：true，眼睛特別大時
- wings：true，有明顯展開胸鰭時
- tail：十六進位色碼，尾鰭與魚身顏色明顯不同時{$extra}

請只輸出 JSON 物件，不要任何其他文字：
PROMPT;
    }
}
