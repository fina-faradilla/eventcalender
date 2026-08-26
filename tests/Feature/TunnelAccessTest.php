<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TunnelAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_shell_uses_built_same_origin_assets(): void
    {
        $response = $this->get('/');

        $response->assertOk()
            ->assertSee('id="app"', false)
            ->assertSee('/build/assets/', false)
            ->assertDontSee('localhost:5173', false)
            ->assertDontSee('127.0.0.1:5173', false);
    }

    public function test_loopback_cloudflare_proxy_headers_restore_public_https_origin(): void
    {
        $response = $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->withHeaders([
                'X-Forwarded-Proto' => 'https',
                'X-Forwarded-Host' => 'mobile-test.trycloudflare.com',
                'X-Forwarded-Port' => '443',
            ])->get('/');

        $response->assertOk();
        $this->assertSame('https://mobile-test.trycloudflare.com', request()->root());
    }

    public function test_failed_initial_session_request_can_return_unauthenticated_without_redirect(): void
    {
        $this->getJson('/api/me')->assertUnauthorized()->assertJson(['message' => 'Unauthenticated.']);
    }
}
