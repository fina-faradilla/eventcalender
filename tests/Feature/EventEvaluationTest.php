<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventEvaluationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_admin_can_evaluate_completed_event(): void
    {
        $admin = User::where('role', 'ADMIN')->first();
        $pic = User::where('role', 'PIC')->first();
        $venue = Venue::first();

        $event = Event::create([
            'created_by' => $pic->id,
            'event_name' => 'Tech Workshop',
            'event_type' => 'Workshop',
            'event_date' => today()->subDays(2),
            'start_time' => '09:00',
            'end_time' => '12:00',
            'venue_id' => $venue->id,
            'staff_required' => 0,
            'status' => 'COMPLETED',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/events/{$event->id}/evaluation", [
                'evaluation' => 'Acara berjalan sangat baik, fasilitas memadai dan peserta sangat antusias.',
            ]);

        $response->assertOk()
            ->assertJsonPath('evaluation', 'Acara berjalan sangat baik, fasilitas memadai dan peserta sangat antusias.')
            ->assertJsonPath('evaluated_by', $admin->id)
            ->assertJsonPath('evaluator.name', $admin->name);

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'evaluation' => 'Acara berjalan sangat baik, fasilitas memadai dan peserta sangat antusias.',
            'evaluated_by' => $admin->id,
        ]);
    }

    public function test_non_admin_cannot_evaluate_event(): void
    {
        $pic = User::where('role', 'PIC')->first();
        $venue = Venue::first();

        $event = Event::create([
            'created_by' => $pic->id,
            'event_name' => 'Tech Workshop',
            'event_type' => 'Workshop',
            'event_date' => today()->subDays(2),
            'start_time' => '09:00',
            'end_time' => '12:00',
            'venue_id' => $venue->id,
            'staff_required' => 0,
            'status' => 'COMPLETED',
        ]);

        $this->actingAs($pic)
            ->postJson("/api/events/{$event->id}/evaluation", [
                'evaluation' => 'Percobaan evaluasi dari PIC.',
            ])
            ->assertForbidden();
    }

    public function test_cannot_evaluate_non_completed_event(): void
    {
        $admin = User::where('role', 'ADMIN')->first();
        $pic = User::where('role', 'PIC')->first();
        $venue = Venue::first();

        $event = Event::create([
            'created_by' => $pic->id,
            'event_name' => 'Upcoming Event',
            'event_type' => 'Meeting',
            'event_date' => today()->addDays(5),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'venue_id' => $venue->id,
            'staff_required' => 0,
            'status' => 'SCHEDULED',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/events/{$event->id}/evaluation", [
                'evaluation' => 'Evaluasi sebelum acara selesai.',
            ])
            ->assertUnprocessable();
    }
}

