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
            // Gemini inlineData 僅支援 jpeg/png/webp/heic/heif（gif/bmp/svg 會被上游 400）
            'image'       => 'required|file|mimes:jpeg,jpg,png,webp,heic,heif|max:5120',
            'description' => 'nullable|string|max:500',
        ]);

        $imageData = base64_encode(file_get_contents($request->file('image')->path()));
        $mimeType  = $request->file('image')->getMimeType();

        $apiKey = config('services.google_ai.key');
        if (! $apiKey) {
            return response()->json(['error' => '尚未設定 GOOGLE_AI_API_KEY（主機環境變數），請設定後再試。'], 422);
        }
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        // AI 呼叫可能超過 PHP 預設 30 秒上限，被砍會回 HTML 錯誤頁而非 JSON
        set_time_limit(120);

        $payload = [
            'contents' => [[
                'parts' => [
                    ['inlineData' => ['mimeType' => $mimeType, 'data' => $imageData]],
                    ['text' => $this->buildPrompt($request->input('description', ''))],
                ],
            ]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',        // JSON 模式：只回純 JSON
                'thinkingConfig'   => ['thinkingBudget' => 0],   // 關閉思考：不會出現 thought parts、
            ],                                                   // 不會思考吃光 token、更快更省
        ];

        // 429（額度）/ 503（過載）/ 逾時 → 自動重試（最多 3 次，指數退避）
        $response = null;
        for ($try = 1; $try <= 3; $try++) {
            try {
                $response = Http::timeout(60)->post($endpoint, $payload);
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                if ($try === 3) {
                    return response()->json(['error' => 'AI 服務連線逾時或失敗（已重試 3 次）：'.$e->getMessage()], 504);
                }
                sleep($try); continue;
            }
            if (in_array($response->status(), [429, 500, 503]) && $try < 3) { sleep($try); continue; }
            break;
        }

        if ($response->failed()) {
            $detail = $response->json('error.message') ?? mb_substr(strip_tags((string) $response->body()), 0, 300);
            return response()->json(['error' => 'AI 服務錯誤（HTTP '.$response->status().'）：'.$detail], 503);
        }

        // 明確區分「被安全機制阻擋 / 生成異常終止」與「格式問題」
        if (! $response->json('candidates.0')) {
            $reason = $response->json('promptFeedback.blockReason', '未知原因');
            return response()->json(['error' => "AI 拒絕分析這張圖片（{$reason}），請換一張照片。"], 422);
        }
        $finish = $response->json('candidates.0.finishReason', 'STOP');
        if (! in_array($finish, ['STOP', 'MAX_TOKENS'])) {
            return response()->json(['error' => "AI 生成異常終止（{$finish}），請換一張照片重試。"], 422);
        }

        // 思考模型防禦：逐一掃 parts，跳過 thought，串接所有文字
        $parts = $response->json('candidates.0.content.parts', []);
        $text  = collect($parts)->reject(fn ($p) => ($p['thought'] ?? false))->pluck('text')->filter()->implode("\n");

        $art = $this->extractArt($text);
        if ($art === null) {
            $hint = $finish === 'MAX_TOKENS' ? '（回應被長度上限截斷）' : '';
            return response()->json(['error' => "無法解析 AI 回應{$hint}，請重試。", 'raw' => mb_substr($text, 0, 200)], 422);
        }

        return response()->json(['art' => $art]);
    }

    /** 巢狀感知抽取第一個完整 JSON 物件，並以白名單過濾/驗證欄位 */
    private function extractArt(string $text): ?array
    {
        $start = strpos($text, '{');
        if ($start === false) return null;
        $depth = 0; $end = null;
        for ($i = $start, $n = strlen($text); $i < $n; $i++) {
            if ($text[$i] === '{') $depth++;
            elseif ($text[$i] === '}' && --$depth === 0) { $end = $i; break; }
        }
        if ($end === null) return null;                                   // 截斷的 JSON
        $raw = json_decode(substr($text, $start, $end - $start + 1), true);
        if (! is_array($raw)) return null;

        // 白名單 + 值域驗證：巢狀/多餘欄位一律丟棄，避免髒資料寫進魚種 art
        $hex = fn ($v) => is_string($v) && preg_match('/^#[0-9a-fA-F]{3,8}$/', $v);
        $art = [];
        if (in_array($raw['shape'] ?? null, ['oval', 'long', 'deep'], true))          $art['shape'] = $raw['shape'];
        if (in_array($raw['pat'] ?? null, ['plain', 'spots', 'bars', 'hline'], true)) $art['pat']   = $raw['pat'];
        foreach (['body', 'belly', 'acc', 'tail'] as $k) if ($hex($raw[$k] ?? null))  $art[$k]      = $raw[$k];
        if (($raw['bigEye'] ?? false) === true) $art['bigEye'] = true;
        if (($raw['wings'] ?? false) === true)  $art['wings']  = true;

        // 必填欄位不齊 → 視為解析失敗（寧可重試也不要存半套）
        foreach (['shape', 'body', 'belly', 'acc', 'pat'] as $k) if (! isset($art[$k])) return null;
        return $art;
    }

    /** 一鍵驗證「主機 → Gemini」整條鏈路（金鑰／模型／網路），不需上傳圖片 */
    public function selfTest(): JsonResponse
    {
        $apiKey = config('services.google_ai.key');
        if (! $apiKey) {
            return response()->json(['error' => '尚未設定 GOOGLE_AI_API_KEY（主機環境變數）。'], 422);
        }
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        try {
            $response = Http::timeout(30)->post($endpoint, [
                'contents' => [['parts' => [['text' => '請只回覆兩個字：OK']]]],
                'generationConfig' => ['thinkingConfig' => ['thinkingBudget' => 0]],
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json(['error' => '無法連上 Gemini：'.$e->getMessage()], 504);
        }

        if ($response->failed()) {
            $detail = $response->json('error.message') ?? mb_substr((string) $response->body(), 0, 300);
            return response()->json(['error' => 'Gemini 回應錯誤（HTTP '.$response->status().'）：'.$detail], 503);
        }

        return response()->json(['ok' => true, 'reply' => trim((string) $response->json('candidates.0.content.parts.0.text', ''))]);
    }

    private function buildPrompt(string $description): string
    {
        $extra = $description ? "\n使用者補充說明：{$description}" : '';

        return <<<PROMPT
請分析這張魚類圖片，輸出用於像素圖生成的 JSON 參數。

必填欄位：
- shape：魚體形狀，只能是 "oval"（橢圓）、"long"（細長）或 "deep"（厚身高背，如刺尾鯛、蝴蝶魚、砲彈魚）
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
