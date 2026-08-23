<?php

namespace Tests\Feature;

use App\Enums\ReminderType;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\Reminder;
use App\Models\User;
use App\Models\Venue;
use App\Services\EventReminderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_h7_notification_uses_dynamic_event_context(): void
    {
        $notification = $this->send(ReminderType::H7);

        $this->assertSame('Pengingat acara H-7', $notification->title);
        $this->assertSame('Acara Training Internal akan dilaksanakan 7 hari lagi pada 20 Agu 2026 pukul 09:00 di Training Center.', $notification->message);
        $this->assertStringNotContainsString('H-3', $notification->message);
        $this->assertStringNotContainsString('H-1', $notification->message);
        $this->assertStringNotContainsString('1 jam', $notification->message);
        $this->assertStringNotContainsString('telah disimulasikan', $notification->message);
    }

    public function test_h3_notification_identifies_three_days_remaining(): void
    {
        $notification = $this->send(ReminderType::H3);

        $this->assertSame('Pengingat acara H-3', $notification->title);
        $this->assertStringContainsString('3 hari lagi', $notification->message);
    }

    public function test_h1_notification_uses_natural_tomorrow_wording(): void
    {
        $notification = $this->send(ReminderType::H1);

        $this->assertSame('Pengingat acara H-1', $notification->title);
        $this->assertStringContainsString('akan dilaksanakan besok', $notification->message);
    }

    public function test_h1_hour_notification_identifies_one_hour_remaining(): void
    {
        $notification = $this->send(ReminderType::H1Hour);

        $this->assertSame('Pengingat acara 1 jam lagi', $notification->title);
        $this->assertSame('Acara Training Internal akan dimulai 1 jam lagi pada pukul 09:00 di Training Center.', $notification->message);
    }

    public function test_repeating_same_reminder_does_not_create_duplicates(): void
    {
        $event = $this->event();
        $service = app(EventReminderService::class);

        $service->send($event, ReminderType::H1);
        $service->send($event, ReminderType::H1);

        $this->assertSame(1, AppNotification::where([
            'event_id' => $event->id,
            'user_id' => $event->created_by,
            'reminder_type' => ReminderType::H1->value,
        ])->count());
        $this->assertSame(1, Reminder::where([
            'event_id' => $event->id,
            'reminder_type' => ReminderType::H1->value,
            'channel' => 'EMAIL_MOCK',
            'recipient' => $event->creator->email,
        ])->count());
    }

    public function test_ineligible_event_statuses_do_not_receive_reminders(): void
    {
        foreach (['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'CANCELLED', 'COMPLETED'] as $status) {
            $event = $this->event($status);
            app(EventReminderService::class)->send($event, ReminderType::H7);
        }

        $this->assertSame(0, AppNotification::whereNotNull('reminder_type')->count());
        $this->assertSame(0, Reminder::count());
    }

    public function test_simulation_endpoint_creates_four_distinct_contextual_notifications_once(): void
    {
        $event = $this->event();
        $pic = $event->creator;

        $this->actingAs($pic)->postJson("/api/events/{$event->id}/reminders")->assertOk();
        $this->actingAs($pic)->postJson("/api/events/{$event->id}/reminders")->assertOk();

        $notifications = AppNotification::where('event_id', $event->id)->whereNotNull('reminder_type')->get();
        $this->assertCount(4, $notifications);
        $this->assertEqualsCanonicalizing(
            array_column(ReminderType::cases(), 'value'),
            $notifications->pluck('reminder_type')->all(),
        );
    }

    public function test_removed_staff_member_is_not_notified(): void
    {
        $event = $this->event();
        $staff = User::where('role', 'STAFF')->first();
        $event->staff()->attach($staff);
        $event->load('staff');
        $event->staff()->detach($staff);

        app(EventReminderService::class)->send($event, ReminderType::H1Hour);

        $this->assertDatabaseMissing('notifications', [
            'event_id' => $event->id,
            'user_id' => $staff->id,
            'reminder_type' => ReminderType::H1Hour->value,
        ]);
    }

    private function send(ReminderType $type): AppNotification
    {
        $event = $this->event();
        app(EventReminderService::class)->send($event, $type);

        return AppNotification::where('event_id', $event->id)
            ->where('reminder_type', $type->value)
            ->where('user_id', $event->created_by)
            ->firstOrFail();
    }

    private function event(string $status = 'SCHEDULED'): Event
    {
        return Event::create([
            'created_by' => User::where('role', 'PIC')->value('id'),
            'event_name' => 'Training Internal',
            'event_type' => 'Training',
            'event_date' => '2026-08-20',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'venue_id' => Venue::where('name', 'Training Center')->value('id'),
            'staff_required' => 0,
            'status' => $status,
        ]);
    }
}
