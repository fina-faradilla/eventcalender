<?php

namespace App\Services;

use App\Enums\ReminderType;
use App\Models\Event;

class ReminderMessageBuilder
{
    private const MONTHS = [
        1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    public function build(Event $event, ReminderType $type): array
    {
        $event->loadMissing('venue');
        $name = $event->event_name;
        $date = $this->date($event);
        $time = substr((string) $event->start_time, 0, 5);
        $venue = $event->venue?->name ?? $event->custom_venue ?? 'lokasi acara';

        return match ($type) {
            ReminderType::H7 => [
                'title' => 'Pengingat acara H-7',
                'message' => "Acara {$name} akan dilaksanakan 7 hari lagi pada {$date} pukul {$time} di {$venue}.",
            ],
            ReminderType::H3 => [
                'title' => 'Pengingat acara H-3',
                'message' => "Acara {$name} akan dilaksanakan 3 hari lagi pada {$date} pukul {$time} di {$venue}.",
            ],
            ReminderType::H1 => [
                'title' => 'Pengingat acara H-1',
                'message' => "Acara {$name} akan dilaksanakan besok, {$date} pukul {$time} di {$venue}.",
            ],
            ReminderType::H1Hour => [
                'title' => 'Pengingat acara 1 jam lagi',
                'message' => "Acara {$name} akan dimulai 1 jam lagi pada pukul {$time} di {$venue}.",
            ],
        };
    }

    private function date(Event $event): string
    {
        $date = $event->event_date;

        return $date->day.' '.self::MONTHS[$date->month].' '.$date->year;
    }
}
