<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\{Event, User};
use App\Services\EventLifecycleService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private EventLifecycleService $lifecycle;
    private User $pic;
    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->lifecycle = app(EventLifecycleService::class);
        $this->pic = User::where('role', 'PIC')->firstOrFail();
        $this->now = CarbonImmutable::parse('2026-08-24 09:30:00', 'Asia/Jakarta');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    private function event(string $status, string $date, string $start = '09:00', string $end = '10:00'): Event
    {
        return Event::create([
            'created_by' => $this->pic->id,
            'event_name' => "Lifecycle {$status}",
            'event_type' => 'Meeting',
            'event_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'staff_required' => 0,
            'status' => $status,
        ]);
    }

    public function test_future_scheduled_event_remains_scheduled(): void
    {
        $event = $this->event(EventStatus::Scheduled->value, '2026-08-25');
        $this->assertNull($this->lifecycle->synchronize($event, $this->now));
        $this->assertSame(EventStatus::Scheduled->value, $event->fresh()->status);
    }

    public function test_scheduled_event_inside_jakarta_time_window_becomes_ongoing(): void
    {
        $event = $this->event(EventStatus::Scheduled->value, '2026-08-24');
        $change = $this->lifecycle->synchronize($event, $this->now);
        $this->assertSame(['event_id' => $event->id, 'from' => 'SCHEDULED', 'to' => 'ONGOING'], $change);
        $this->assertSame(EventStatus::Ongoing->value, $event->fresh()->status);
    }

    public function test_finished_scheduled_and_ongoing_events_become_completed(): void
    {
        foreach ([EventStatus::Scheduled->value, EventStatus::Ongoing->value] as $status) {
            $event = $this->event($status, '2026-08-24', '07:00', '08:00');
            $this->lifecycle->synchronize($event, $this->now);
            $this->assertSame(EventStatus::Completed->value, $event->fresh()->status);
        }
    }

    public function test_non_operational_statuses_never_auto_transition(): void
    {
        foreach ([EventStatus::Draft, EventStatus::Pending, EventStatus::Rejected, EventStatus::Cancelled] as $status) {
            $event = $this->event($status->value, '2026-08-23');
            $this->assertNull($this->lifecycle->synchronize($event, $this->now));
            $this->assertSame($status->value, $event->fresh()->status);
        }
    }

    public function test_command_is_idempotent(): void
    {
        $this->event(EventStatus::Scheduled->value, '2026-08-24', '07:00', '08:00');
        CarbonImmutable::setTestNow($this->now);
        $this->artisan('events:sync-status')->assertSuccessful();
        $this->artisan('events:sync-status')->expectsOutputToContain('Total perubahan: 0')->assertSuccessful();
    }

    public function test_role_metrics_and_completed_filters_use_canonical_status(): void
    {
        $completed = $this->event(EventStatus::Completed->value, '2026-08-23');
        $staff = User::where('role', 'STAFF')->firstOrFail();
        $completed->staff()->sync([$staff->id]);

        $this->actingAs($this->pic)->getJson('/api/dashboard')->assertOk()->assertJsonPath('completed', fn ($value) => $value >= 1);
        $this->actingAs(User::where('role', 'ADMIN')->firstOrFail())->getJson('/api/events?status=COMPLETED')->assertOk()->assertJsonFragment(['id' => $completed->id]);
        $this->actingAs(User::where('role', 'APPROVER')->firstOrFail())->getJson('/api/dashboard')->assertOk()->assertJsonPath('completed', fn ($value) => $value >= 1);
        $this->actingAs($staff)->getJson('/api/staff/assignments?filter=completed')->assertOk()->assertJsonFragment(['id' => $completed->id]);
    }
}
