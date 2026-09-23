<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SsoController extends Controller
{
    /**
     * Redirect user ke Keycloak SSO.
     */
    public function redirect()
    {
        return Socialite::driver('keycloak')->redirect();
    }

    /**
     * Handle callback dari Keycloak SSO.
     */
    public function callback()
    {
        try {
            $ssoUser = Socialite::driver('keycloak')->user();
            $ssoId = $ssoUser->getId();
            $email = $ssoUser->getEmail();
            $username = $ssoUser->getNickname() ?? ($ssoUser->user['preferred_username'] ?? null);
            
            // Extract custom attributes dari Keycloak token
            $employeeId = $ssoUser->user['employee_id'] 
                ?? ($ssoUser->user['attributes']['employee_id'][0] ?? null);
            $phone = $ssoUser->user['no_telepon'] 
                ?? ($ssoUser->user['attributes']['no_telepon'][0] ?? ($ssoUser->user['phone'] ?? null));

            // Simpan ID Token untuk federated logout
            if (isset($ssoUser->accessTokenResponseBody['id_token'])) {
                session(['keycloak_id_token' => $ssoUser->accessTokenResponseBody['id_token']]);
            }

            // Extract client roles untuk event-calendar
            $clientRoles = $ssoUser->user['resource_access']['event-calendar']['roles'] 
                ?? ($ssoUser->user['resource_access']['event-calender']['roles'] ?? []);

            $upperRoles = array_map('strtoupper', $clientRoles);
            $assignedRole = null;
            if (in_array('ADMIN', $upperRoles, true)) {
                $assignedRole = 'ADMIN';
            } elseif (in_array('APPROVER', $upperRoles, true)) {
                $assignedRole = 'APPROVER';
            } elseif (in_array('PIC', $upperRoles, true)) {
                $assignedRole = 'PIC';
            } elseif (in_array('STAFF', $upperRoles, true)) {
                $assignedRole = 'STAFF';
            }

            Log::info('Keycloak SSO Callback received (Event Calendar)', [
                'ssoId' => $ssoId,
                'email' => $email,
                'username' => $username,
                'employeeId' => $employeeId,
                'clientRoles' => $clientRoles,
                'assignedRole' => $assignedRole,
            ]);

            // Cari user di database berdasarkan sso_id, employee_id, atau email
            $user = User::query()
                ->when($ssoId, fn ($query) => $query->where('sso_id', $ssoId))
                ->when($employeeId, fn ($query) => $query->orWhere('employee_id', $employeeId))
                ->orWhere(function ($query) use ($email) {
                    if ($email) {
                        $query->whereRaw('LOWER(email) = ?', [strtolower($email)]);
                    }
                })
                ->first();

            $name = $ssoUser->getName() ?: ($username ?: 'Pengguna SSO');
            $fallbackEmail = $email ?: ($username ? "{$username}@technolife.local" : "sso_{$ssoId}@technolife.local");

            if (! $user) {
                // Auto-create user jika baru pertama kali login lewat SSO
                $user = User::create([
                    'name' => $name,
                    'email' => $fallbackEmail,
                    'password' => bcrypt(str()->random(32)),
                    'role' => $assignedRole ?? 'PIC',
                    'phone' => $phone,
                    'is_active' => true,
                    'sso_id' => $ssoId,
                    'employee_id' => $employeeId,
                ]);
            } else {
                // Sinkronkan data terbaru dari Keycloak
                if (! $user->sso_id && $ssoId) {
                    $user->sso_id = $ssoId;
                }
                if ($employeeId && ! $user->employee_id) {
                    $user->employee_id = $employeeId;
                }
                if ($phone && ! $user->phone) {
                    $user->phone = $phone;
                }
                if ($name && $user->name !== $name) {
                    $user->name = $name;
                }
                if ($assignedRole) {
                    $user->role = $assignedRole;
                }
                if ($user->isDirty()) {
                    $user->save();
                }
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

            // Redirect ke halaman utama / dashboard
            return redirect('/');

        } catch (\Throwable $e) {
            Log::error('SSO Error: ' . $e->getMessage(), ['exception' => $e]);

            return redirect('/')->withErrors([
                'email' => 'Login SSO gagal: ' . $e->getMessage(),
            ]);
        }
    }
}