<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SsoController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('keycloak')->redirect();
    }

    public function callback()
    {
        try {
            $ssoUser = Socialite::driver('keycloak')->user();
            $ssoId = $ssoUser->getId();
            $email = $ssoUser->getEmail();
            $username = $ssoUser->getNickname() ?? ($ssoUser->user['preferred_username'] ?? null);
            $employeeId = $ssoUser->user['employee_id'] ?? null;

            Log::info('Keycloak SSO Callback received', [
                'ssoId' => $ssoId,
                'email' => $email,
                'username' => $username,
                'employeeId' => $employeeId,
            ]);

            // Cari user di database
            $user = User::query()
                ->when($ssoId, fn ($query) => $query->where('sso_id', $ssoId))
                ->when($employeeId, fn ($query) => $query->orWhere('employee_id', $employeeId))
                ->orWhere(function ($query) use ($email) {
                    if ($email) {
                        $query->whereRaw('LOWER(email) = ?', [strtolower($email)]);
                    }
                })
                ->first();

            if (! $user) {
                // Auto-create user jika baru pertama kali login lewat SSO
                $name = $ssoUser->getName() ?: ($ssoUser->getNickname() ?: 'Pengguna SSO');
                $user = User::create([
                    'name' => $name,
                    'email' => $email ?: ($username ? "{$username}@technolife.test" : "sso_{$ssoId}@technolife.test"),
                    'password' => bcrypt(str()->random(32)),
                    'role' => 'PIC',
                    'is_active' => true,
                    'sso_id' => $ssoId,
                    'employee_id' => $employeeId,
                ]);
            }

            // Simpan / tautkan sso_id jika belum terisi
            if (! $user->sso_id) {
                $user->sso_id = $ssoId;
            }
            if ($employeeId && ! $user->employee_id) {
                $user->employee_id = $employeeId;
            }
            if ($user->isDirty()) {
                $user->save();
            }

            // Validasi akun aktif
            if (! $user->is_active) {
                return redirect('/')->withErrors([
                    'email' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.',
                ]);
            }

            // Login-kan user ke sistem sesi Laravel
            Auth::login($user);
            request()->session()->regenerate();

            // Redirect ke halaman dashboard/utama
            return redirect('/');

        } catch (\Throwable $e) {
            Log::error('SSO Error: ' . $e->getMessage(), ['exception' => $e]);

            return redirect('/')->withErrors([
                'email' => 'Login SSO gagal: ' . $e->getMessage(),
            ]);
        }
    }
}