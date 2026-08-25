<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_mark_all_own_notifications_read_without_affecting_another_user(): void
    {
        [$user, $other] = $this->users();
        $ownUnread = $this->notification($user);
        $ownRead = $this->notification($user, now()->subHour());
        $otherUnread = $this->notification($other);

        $this->actingAs($user)->patchJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('updated_count', 1)
            ->assertJsonPath('unread_count', 0);

        $this->assertNotNull($ownUnread->fresh()->read_at);
        $this->assertNotNull($ownRead->fresh()->read_at);
        $this->assertNull($otherUnread->fresh()->read_at);
        $this->actingAs($user)->getJson('/api/notifications')->assertJsonPath('unread_count', 0);
    }

    public function test_authenticated_user_can_delete_all_own_notifications_without_affecting_another_user(): void
    {
        [$user, $other] = $this->users();
        $this->notification($user);
        $this->notification($user, now());
        $otherNotification = $this->notification($other);

        $this->actingAs($user)->deleteJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('deleted_count', 2)
            ->assertJsonPath('unread_count', 0);

        $this->assertDatabaseMissing('notifications', ['user_id' => $user->id]);
        $this->assertDatabaseHas('notifications', ['id' => $otherNotification->id, 'user_id' => $other->id]);
        $this->actingAs($user)->getJson('/api/notifications')->assertJsonPath('unread_count', 0)->assertJsonCount(0, 'data');
    }

    public function test_notification_bulk_actions_require_authentication(): void
    {
        $this->patchJson('/api/notifications/read-all')->assertUnauthorized();
        $this->deleteJson('/api/notifications')->assertUnauthorized();
    }

    private function users(): array
    {
        return [
            User::factory()->create(['role' => 'PIC']),
            User::factory()->create(['role' => 'STAFF']),
        ];
    }

    private function notification(User $user, $readAt = null): AppNotification
    {
        return AppNotification::create([
            'user_id' => $user->id,
            'title' => 'Pemberitahuan pengujian',
            'message' => 'Isi pemberitahuan pengujian.',
            'read_at' => $readAt,
        ]);
    }
}
