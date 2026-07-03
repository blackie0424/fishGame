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
            return redirect()->route('admin.login');
        }

        return $next($request);
    }
}
