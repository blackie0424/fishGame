<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 極簡後台驗證：以 .env 的 ADMIN_PASSWORD 登入（session 記錄）。
 * 之後可無痛替換為 Laravel Breeze / Fortify 等完整認證。
 */
class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('is_admin')) {
            // AJAX（如 AI 分析）不可回 302：跟隨轉址會拿到登入頁 HTML，前端只會看到「網路錯誤」
            if ($request->expectsJson()) {
                return response()->json(['error' => '後台登入已逾時，請重新整理頁面並登入後再試。'], 401);
            }

            return redirect()->route('admin.login');
        }

        return $next($request);
    }
}
