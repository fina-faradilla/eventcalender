<?php

namespace Database\Seeders;

use App\Models\{AppNotification, Event, User, Venue};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');
        $pic = User::updateOrCreate(['email' => 'pic@technolife.test'], ['name' => 'Nadia Pratama', 'role' => 'PIC', 'password' => $password, 'phone' => '081200000001', 'is_active' => true]);
        User::updateOrCreate(['email' => 'approver@technolife.test'], ['name' => 'Bima Santoso', 'role' => 'APPROVER', 'password' => $password, 'is_active' => true]);
        User::updateOrCreate(['email' => 'admin@technolife.test'], ['name' => 'System Administrator', 'role' => 'ADMIN', 'password' => $password, 'is_active' => true]);

        $names = ['Alya Putri', 'Dimas Saputra', 'Fajar Ramadhan', 'Maya Lestari', 'Rizky Maulana', 'Sinta Dewi'];
        $staff = collect(range(1, 6))->map(fn ($number) => User::updateOrCreate(
            ['email' => "staff{$number}@technolife.test"],
            ['name' => $names[$number - 1], 'role' => 'STAFF', 'password' => $password, 'is_active' => true]
        ));

        foreach ([['Ballroom', 'Aula', 500], ['Training Center', 'Ruang Pelatihan', 100], ['Plaza Exhibition', 'Area Pameran', 300], ['Resto', 'Area Hospitality', 80]] as [$name, $type, $capacity]) {
            Venue::updateOrCreate(['name' => $name], ['type' => $type, 'capacity' => $capacity, 'location' => 'Technolife HQ', 'is_active' => true]);
        }

        $event = Event::updateOrCreate(
            ['event_name' => 'Technolife Internal Training', 'created_by' => $pic->id],
            ['event_type' => 'Training', 'event_date' => '2026-08-20', 'start_time' => '09:00', 'end_time' => '15:00', 'venue_id' => Venue::where('name', 'Training Center')->value('id'), 'participants_count' => 50, 'staff_required' => 5, 'description' => 'Internal training event.', 'status' => 'SCHEDULED']
        );
        $event->staff()->sync($staff->take(5)->pluck('id'));
        AppNotification::firstOrCreate(['user_id' => $pic->id, 'event_id' => $event->id, 'title' => 'Event disetujui'], ['message' => 'Technolife Internal Training telah dijadwalkan.']);
    }
}
