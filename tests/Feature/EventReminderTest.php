<?php

namespace Tests\Feature;

use App\Enums\ReminderType;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\Reminder;
use App\Models\User;
use App\Models\Venue;
use App\Services\EventReminderService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Event::query()->delete();
    }

    public function test_reminder_schedule_uses_the_event_start_in_jakarta(): void
    {
        $event = $this->event(CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta'));
        $service = app(EventReminderService::class);

        $this->assertSame('2026-08-17 09:00', $service->scheduledAt($event, ReminderType::H3)->format('Y-m-d H:i'));
        $this->assertSame('2026-08-18 09:00', $service->scheduledAt($event, ReminderType::H2)->format('Y-m-d H:i'));
        $this->assertSame('2026-08-19 09:00', $service->scheduledAt($event, ReminderType::H1)->format('Y-m-d H:i'));
        $this->assertSame('2026-08-20 08:00', $service->scheduledAt($event, ReminderType::H1Hour)->format('Y-m-d H:i'));
        $this->assertSame('Asia/Jakarta', $service->scheduledAt($event, ReminderType::H3)->timezoneName);
    }

    public function test_due_reminder_is_sent_with_dynamic_context(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        $event = $this->event($start);

        $result = app(EventReminderService::class)->processDue($start->subDays(2));

        $notification = AppNotification::where('event_id', $event->id)->firstOrFail();
        $this->assertSame(1, $result['reminders_due']);
        $this->assertSame(ReminderType::H2->value, $notification->reminder_type);
        $this->assertSame('Pengingat acara H-2', $notification->title);
        $this->assertSame('Acara Training Internal akan dilaksanakan 2 hari lagi pada 20 Agu 2026 pukul 09:00 di Training Center.', $notification->message);
    }

    public function test_scheduler_does_not_send_before_or_after_the_due_window(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        $event = $this->event($start);
        $service = app(EventReminderService::class);

        $service->processDue($start->subDays(3)->subSecond());
        $service->processDue($start->subDays(3)->addMinutes(2));

        $this->assertDatabaseMissing('notifications', ['event_id' => $event->id, 'reminder_type' => ReminderType::H3->value]);
        $this->assertSame(0, Reminder::count());
    }

    public function test_each_scheduler_pass_only_sends_the_current_reminder_type(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        $event = $this->event($start);
        $service = app(EventReminderService::class);

        foreach ([ReminderType::H3, ReminderType::H2, ReminderType::H1, ReminderType::H1Hour] as $type) {
            $service->processDue($service->scheduledAt($event, $type));
        }

        $this->assertEqualsCanonicalizing(
            ['H3', 'H2', 'H1', 'H1_HOUR'],
            AppNotification::where('event_id', $event->id)->pluck('reminder_type')->all(),
        );
        $this->assertDatabaseMissing('notifications', ['event_id' => $event->id, 'reminder_type' => 'H7']);
    }

    public function test_repeated_scheduler_pass_does_not_create_duplicates(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        $event = $this->event($start);
        $service = app(EventReminderService::class);
        $due = $start->subDay();

        $service->processDue($due);
        $service->processDue($due->addMinute());

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

    public function test_pic_and_currently_assigned_staff_receive_due_notifications(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        $event = $this->event($start);
        $assigned = User::where('role', 'STAFF')->firstOrFail();
        $removed = User::factory()->create(['role' => 'STAFF']);
        $event->staff()->attach([$assigned->id, $removed->id]);
        $event->staff()->detach($removed->id);

        app(EventReminderService::class)->processDue($start->subHour());

        $this->assertEqualsCanonicalizing(
            [$event->created_by, $assigned->id],
            AppNotification::where('event_id', $event->id)->pluck('user_id')->all(),
        );
        $this->assertDatabaseMissing('notifications', [
            'event_id' => $event->id,
            'user_id' => $removed->id,
            'reminder_type' => ReminderType::H1Hour->value,
        ]);
    }

    public function test_only_scheduled_events_receive_automatic_reminders(): void
    {
        $start = CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta');
        foreach (['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ONGOING', 'CANCELLED', 'COMPLETED'] as $status) {
            $this->event($start, $status);
        }

        app(EventReminderService::class)->processDue($start->subDays(3));

        $this->assertSame(0, AppNotification::whereNotNull('reminder_type')->count());
        $this->assertSame(0, Reminder::count());
    }

    public function test_manual_reminder_simulation_endpoint_is_not_available(): void
    {
        $event = $this->event(CarbonImmutable::parse('2026-08-20 09:00', 'Asia/Jakarta'));

        $this->actingAs($event->creator)->postJson("/api/events/{$event->id}/reminders")->assertMethodNotAllowed();
    }

    private function event(CarbonImmutable $start, string $status = 'SCHEDULED'): Event
    {
        return Event::create([
            'created_by' => User::where('role', 'PIC')->value('id'),
            'event_name' => 'Training Internal',
            'event_type' => 'Training',
            'event_date' => $start->toDateString(),
            'start_time' => $start->format('H:i'),
            'end_time' => $start->addHour()->format('H:i'),
            'venue_id' => Venue::where('name', 'Training Center')->value('id'),
            'staff_required' => 0,
            'status' => $status,
        ]);
    }
}
