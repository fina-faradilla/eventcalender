<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\SsoController;
Route::get('/auth/sso', [SsoController::class, 'redirect'])
    ->name('sso.login');
Route::get('/auth/sso/callback', [SsoController::class, 'callback'])
    ->name('sso.callback');

Route::get('/auth/keycloak/redirect', [SsoController::class, 'redirect'])
    ->name('sso.keycloak.redirect');
Route::get('/auth/keycloak/callback', [SsoController::class, 'callback'])
    ->name('sso.keycloak.callback');

Route::prefix('api')->group(base_path('routes/api.php'));

Route::view('/{path?}', 'app')->where('path','.*');