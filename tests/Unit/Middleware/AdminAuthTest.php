<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\AdminAuth;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    public function test_authenticated_request_passes_through(): void
    {
        $request = Request::create('/admin', 'GET');
        $request->setLaravelSession($this->app['session']->driver());
        $request->session()->put('is_admin', true);

        $middleware = new AdminAuth();
        $response = $middleware->handle($request, fn () => new Response('ok'));

        $this->assertSame('ok', $response->getContent());
    }

    public function test_unauthenticated_request_redirects_to_login(): void
    {
        $request = Request::create('/admin', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $middleware = new AdminAuth();
        $response = $middleware->handle($request, fn () => new Response('ok'));

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('admin/login', $response->getTargetUrl());
    }

    public function test_false_session_value_redirects_to_login(): void
    {
        $request = Request::create('/admin', 'GET');
        $request->setLaravelSession($this->app['session']->driver());
        $request->session()->put('is_admin', false);

        $middleware = new AdminAuth();
        $response = $middleware->handle($request, fn () => new Response('ok'));

        $this->assertInstanceOf(RedirectResponse::class, $response);
    }
}
