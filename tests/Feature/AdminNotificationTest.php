<?php

namespace Tests\Feature;

use App\Enums\ReminderType;
use App\Mail\AdminOperationalNotificationMail;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\User;
use App\Models\Venue;
use App\Services\EventReminderService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Event::query()->delete();
        Mail::fake();
    }

    public function test_pic_submission_notifies_every_active_admin_in_app_and_by_users_email(): void
    {
        $pic = User::where('role', 'PIC')->firstOrFail();
        $firstAdmin = User::where('role', 'ADMIN')->firstOrFail();
        $secondAdmin = User::factory()->create(['role' => 'ADMIN', 'is_active' => true, 'email' => 'ops-admin@technolife.test']);
        $inactiveAdmin = User::factory()->create(['role' => 'ADMIN', 'is_active' => false, 'email' => 'inactive-admin@technolife.test']);

        $eventId = $this->actingAs($pic)->postJson('/api/events', $this->payload())->assertCreated()->json('id');

        foreach ([$firstAdmin, $secondAdmin] as $admin) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $admin->id,
                'event_id' => $eventId,
                'title' => 'Pengajuan acara baru',
                'message' => "{$pic->name} mengajukan acara \"Audit Operasional\" untuk ditinjau.",
            ]);
            Mail::assertQueued(AdminOperationalNotificationMail::class, fn ($mail) => $mail->hasTo($admin->email));
        }
        $this->assertDatabaseMissing('notifications', ['user_id' => $inactiveAdmin->id, 'event_id' => $eventId]);
        Mail::assertNotQueued(AdminOperationalNotificationMail::class, fn ($mail) => $mail->hasTo($inactiveAdmin->email));
        $this->assertDatabaseHas('notifications', ['user_id' => User::where('role', 'APPROVER')->value('id'), 'event_id' => $eventId, 'title' => 'Persetujuan baru']);
        $this->assertDatabaseHas('notifications', ['user_id' => $pic->id, 'event_id' => $eventId, 'title' => 'Event dikirim']);
    }

    public function test_approver_approval_notifies_admin_without_replacing_pic_notification(): void
    {
        [$event, $approver, $admin] = $this->pendingEvent();

        $this->actingAs($approver)->postJson("/api/events/{$event->id}/decision", ['decision' => 'APPROVE'])->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'event_id' => $event->id, 'title' => 'Acara disetujui']);
        $this->assertDatabaseHas('notifications', ['user_id' => $event->created_by, 'event_id' => $event->id, 'title' => 'Event disetujui']);
    }

    public function test_approver_rejection_notifies_admin(): void
    {
        [$event, $approver, $admin] = $this->pendingEvent();

        $this->actingAs($approver)->postJson("/api/events/{$event->id}/decision", ['decision' => 'REJECT', 'rejection_reason' => 'Detail kegiatan belum lengkap.'])->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'event_id' => $event->id, 'title' => 'Acara ditolak']);
    }

    public function test_pic_resubmission_notifies_admin(): void
    {
        [$event, $approver, $admin] = $this->pendingEvent();
        $this->actingAs($approver)->postJson("/api/events/{$event->id}/decision", ['decision' => 'REJECT', 'rejection_reason' => 'Detail kegiatan belum lengkap.'])->assertOk();

        $this->actingAs($event->creator)->putJson("/api/events/{$event->id}", $this->payload())->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'event_id' => $event->id, 'title' => 'Acara diajukan ulang']);
    }

    public function test_staff_assignment_change_notifies_admin_and_preserves_staff_notification(): void
    {
        $pic = User::where('role', 'PIC')->firstOrFail();
        $admin = User::where('role', 'ADMIN')->firstOrFail();
        $staff = User::where('role', 'STAFF')->firstOrFail();
        $payload = $this->payload(['staff_required' => 1, 'staff_ids' => [$staff->id]]);

        $eventId = $this->actingAs($pic)->postJson('/api/events', $payload)->assertCreated()->json('id');

        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'event_id' => $eventId, 'title' => 'Penugasan staf diperbarui']);
        $this->assertDatabaseHas('notifications', ['user_id' => $staff->id, 'event_id' => $eventId, 'title' => 'Penugasan event']);
    }

    public function test_event_cancellation_notifies_admin(): void
    {
        [$event, , $admin] = $this->pendingEvent();

        $event->update(['status' => 'CANCELLED']);

        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'event_id' => $event->id, 'title' => 'Acara dibatalkan']);
    }

    public function test_all_reminder_types_exclude_admin(): void
    {
        $admin = User::where('role', 'ADMIN')->firstOrFail();
        $start = CarbonImmutable::parse('2026-09-10 09:00', 'Asia/Jakarta');
        $event = $this->event('SCHEDULED', $start);
        $service = app(EventReminderService::class);

        foreach (ReminderType::cases() as $type) {
            $service->send($event, $type, $service->scheduledAt($event, $type));
        }

        $this->assertDatabaseMissing('notifications', ['user_id' => $admin->id, 'event_id' => $event->id]);
    }

    private function pendingEvent(): array
    {
        $event = $this->event('PENDING_APPROVAL');

        return [$event, User::where('role', 'APPROVER')->firstOrFail(), User::where('role', 'ADMIN')->firstOrFail()];
    }

    private function event(string $status, ?CarbonImmutable $start = null): Event
    {
        $start ??= now()->toImmutable()->addDays(10)->setTime(9, 0);

        return Event::create([
            'created_by' => User::where('role', 'PIC')->value('id'),
            'event_name' => 'Audit Operasional',
            'event_type' => 'Meeting',
            'event_date' => $start->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'venue_id' => Venue::first()->id,
            'staff_required' => 0,
            'status' => $status,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'event_name' => 'Audit Operasional',
            'event_type' => 'Meeting',
            'event_date' => now()->addDays(10)->format('Y-m-d'),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'venue_id' => Venue::first()->id,
            'staff_required' => 0,
            'staff_ids' => [],
            'description' => 'Audit alur operasional.',
            'submit' => true,
        ];
    }
}
