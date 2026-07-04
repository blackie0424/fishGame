<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.admin_password' => 'secret123']);
    }

    public function test_guest_can_view_login_page(): void
    {
        $response = $this->get('/admin/login');

        $response->assertStatus(200);
    }

    public function test_correct_password_redirects_to_dashboard(): void
    {
        $response = $this->post('/admin/login', ['password' => 'secret123']);

        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('is_admin', true);
    }

    public function test_wrong_password_returns_validation_error(): void
    {
        $response = $this->post('/admin/login', ['password' => 'wrong']);

        $response->assertSessionHasErrors('password');
        $response->assertSessionMissing('is_admin');
    }

    public function test_empty_password_fails_validation(): void
    {
        $response = $this->post('/admin/login', ['password' => '']);

        $response->assertSessionHasErrors('password');
    }

    public function test_logout_clears_session_and_redirects(): void
    {
        $response = $this->withSession(['is_admin' => true])
            ->post('/admin/logout');

        $response->assertRedirect(route('admin.login'));
        $response->assertSessionMissing('is_admin');
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $response = $this->get('/admin/');

        $response->assertRedirect(route('admin.login'));
    }
}
