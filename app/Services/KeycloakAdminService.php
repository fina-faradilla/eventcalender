<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KeycloakAdminService
{
    protected string $baseUrl;
    protected string $realm;
    protected string $adminRealm;
    protected string $adminUsername;
    protected string $adminPassword;
    protected ?string $clientId;
    protected ?string $clientSecret;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.keycloak.base_url', env('KEYCLOAK_BASE_URL', 'http://192.168.1.201:8080')), '/');
        $this->realm = config('services.keycloak.realms', env('KEYCLOAK_REALM', 'technolife'));
        $this->adminRealm = env('KEYCLOAK_ADMIN_REALM', 'master');
        $this->adminUsername = env('KEYCLOAK_ADMIN_USERNAME', 'admin');
        $this->adminPassword = env('KEYCLOAK_ADMIN_PASSWORD', 'admin');
        $this->clientId = env('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli');
        $this->clientSecret = env('KEYCLOAK_ADMIN_CLIENT_SECRET', null);
    }

    /**
     * Dapatkan access token admin Keycloak.
     */
    public function getAdminToken(): string
    {
        return Cache::remember('keycloak_admin_token', 50, function () {
            // Coba 1: Menggunakan client_credentials jika ada secret
            if ($this->clientSecret) {
                $response = Http::asForm()->post("{$this->baseUrl}/realms/{$this->realm}/protocol/openid-connect/token", [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'grant_type' => 'client_credentials',
                ]);

                if ($response->successful() && $response->json('access_token')) {
                    return $response->json('access_token');
                }
            }

            // Coba 2: Menggunakan password grant admin-cli pada master realm
            $response = Http::asForm()->post("{$this->baseUrl}/realms/{$this->adminRealm}/protocol/openid-connect/token", [
                'client_id' => 'admin-cli',
                'username' => $this->adminUsername,
                'password' => $this->adminPassword,
                'grant_type' => 'password',
            ]);

            if ($response->successful() && $response->json('access_token')) {
                return $response->json('access_token');
            }

            // Coba 3: Menggunakan password grant pada realm technolife
            $response = Http::asForm()->post("{$this->baseUrl}/realms/{$this->realm}/protocol/openid-connect/token", [
                'client_id' => 'admin-cli',
                'username' => $this->adminUsername,
                'password' => $this->adminPassword,
                'grant_type' => 'password',
            ]);

            if ($response->successful() && $response->json('access_token')) {
                return $response->json('access_token');
            }

            Log::error('Keycloak Admin Auth Failed', [
                'response' => $response->json(),
                'status' => $response->status(),
            ]);

            throw new \RuntimeException('Gagal terhubung ke Keycloak Admin API.');
        });
    }

    protected function client()
    {
        return Http::withToken($this->getAdminToken())
            ->acceptJson()
            ->timeout(15);
    }

    public function getUsers(?string $search = null, int $first = 0, int $max = 100): array
    {
        $params = ['first' => $first, 'max' => $max];
        if ($search) {
            $params['search'] = $search;
        }

        $response = $this->client()->get("{$this->baseUrl}/admin/realms/{$this->realm}/users", $params);
        return $response->successful() ? $response->json() : [];
    }

    public function getUser(string $userId): ?array
    {
        $response = $this->client()->get("{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}");
        return $response->successful() ? $response->json() : null;
    }

    public function createUser(array $userData): string
    {
        $password = $userData['password'] ?? $userData['pin'] ?? '123456';
        $username = $userData['username'] ?? explode('@', $userData['email'])[0];
        $email = $userData['email'] ?? ($username . '@technolife.local');

        $payload = [
            'username' => $username,
            'enabled' => $userData['enabled'] ?? true,
            'emailVerified' => false,
            'firstName' => $userData['firstName'] ?? $userData['name'] ?? $username,
            'lastName' => $userData['lastName'] ?? '',
            'email' => $email,
            'attributes' => [
                'PIN' => [$password],
                'no_telepon' => [$userData['no_telepon'] ?? ($userData['phone'] ?? '')],
                'employee_id' => [$userData['employee_id'] ?? ''],
            ],
            'credentials' => [
                [
                    'type' => 'password',
                    'value' => $password,
                    'temporary' => false,
                ]
            ],
        ];

        $response = $this->client()->post("{$this->baseUrl}/admin/realms/{$this->realm}/users", $payload);

        if (! $response->successful()) {
            $errorMessage = $response->json('errorMessage') ?? 'Gagal membuat user di Keycloak.';
            throw new \RuntimeException($errorMessage);
        }

        $location = $response->header('Location');
        if ($location) {
            $parts = explode('/', $location);
            return end($parts);
        }

        $found = $this->getUsers($username, 0, 1);
        return $found[0]['id'] ?? '';
    }

    public function updateUser(string $userId, array $userData): bool
    {
        $currentUser = $this->getUser($userId);
        if (! $currentUser) {
            return false;
        }

        $attributes = $currentUser['attributes'] ?? [];
        if (isset($userData['pin']) || isset($userData['password'])) {
            $attributes['PIN'] = [$userData['pin'] ?? $userData['password']];
        }
        if (isset($userData['no_telepon']) || isset($userData['phone'])) {
            $attributes['no_telepon'] = [$userData['no_telepon'] ?? $userData['phone']];
        }
        if (isset($userData['employee_id'])) {
            $attributes['employee_id'] = [$userData['employee_id']];
        }

        $payload = [
            'username' => $userData['username'] ?? $currentUser['username'],
            'enabled' => $userData['enabled'] ?? ($userData['is_active'] ?? ($currentUser['enabled'] ?? true)),
            'emailVerified' => $currentUser['emailVerified'] ?? false,
            'firstName' => $userData['firstName'] ?? $userData['name'] ?? ($currentUser['firstName'] ?? ''),
            'lastName' => $userData['lastName'] ?? ($currentUser['lastName'] ?? ''),
            'email' => $userData['email'] ?? $currentUser['email'],
            'attributes' => $attributes,
        ];

        $response = $this->client()->put("{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}", $payload);

        if (! empty($userData['password'])) {
            $this->resetPassword($userId, $userData['password'], false);
        }

        return $response->successful();
    }

    public function resetPassword(string $userId, string $newPassword, bool $temporary = false): bool
    {
        $response = $this->client()->put("{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}/reset-password", [
            'type' => 'password',
            'value' => $newPassword,
            'temporary' => $temporary,
        ]);

        return $response->successful();
    }

    public function getClientsMap(): array
    {
        return Cache::remember('keycloak_clients_map', 300, function () {
            $response = $this->client()->get("{$this->baseUrl}/admin/realms/{$this->realm}/clients");
            if (! $response->successful()) {
                return [];
            }

            $map = [];
            foreach ($response->json() as $client) {
                $map[$client['clientId']] = [
                    'id' => $client['id'],
                    'clientId' => $client['clientId'],
                    'name' => $client['name'] ?? $client['clientId'],
                ];
            }

            return $map;
        });
    }

    public function getClientRoles(string $clientInternalId): array
    {
        $response = $this->client()->get("{$this->baseUrl}/admin/realms/{$this->realm}/clients/{$clientInternalId}/roles");
        return $response->successful() ? $response->json() : [];
    }

    public function getUserClientRoles(string $userId, string $clientInternalId): array
    {
        $response = $this->client()->get("{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}/role-mappings/clients/{$clientInternalId}");
        return $response->successful() ? $response->json() : [];
    }

    public function syncUserClientRole(string $userId, string $clientName, ?string $selectedRole): bool
    {
        $clientsMap = $this->getClientsMap();
        if (! isset($clientsMap[$clientName])) {
            return false;
        }

        $clientInternalId = $clientsMap[$clientName]['id'];
        $availableRoles = $this->getClientRoles($clientInternalId);
        $roleObjectsMap = [];
        foreach ($availableRoles as $r) {
            $roleObjectsMap[strtoupper($r['name'])] = $r;
        }

        $currentRoles = $this->getUserClientRoles($userId, $clientInternalId);
        if (! empty($currentRoles)) {
            $this->client()->delete(
                "{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}/role-mappings/clients/{$clientInternalId}",
                $currentRoles
            );
        }

        if ($selectedRole && isset($roleObjectsMap[strtoupper($selectedRole)])) {
            $this->client()->post(
                "{$this->baseUrl}/admin/realms/{$this->realm}/users/{$userId}/role-mappings/clients/{$clientInternalId}",
                [$roleObjectsMap[strtoupper($selectedRole)]]
            );
        }

        return true;
    }
}

