<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Models\Event;
use Carbon\CarbonImmutable;
use DateTimeInterface;

class EventLifecycleService
{
    private const ELIGIBLE = [
        EventStatus::Approved->value,
        EventStatus::Scheduled->value,
        EventStatus::Ongoing->value,
    ];

    public function statusAt(Event $event, DateTimeInterface|string|null $at = null): string
    {
        if (! in_array($event->status, self::ELIGIBLE, true) || ! $event->event_date || ! $event->start_time || ! $event->end_time) {
            return $event->status;
        }

        $timezone = config('app.timezone');
        $now = $at instanceof DateTimeInterface
            ? CarbonImmutable::instance($at)->setTimezone($timezone)
            : CarbonImmutable::parse($at ?? 'now', $timezone);
        $date = $event->event_date->format('Y-m-d');
        $start = CarbonImmutable::parse("{$date} {$event->start_time}", $timezone);
        $end = CarbonImmutable::parse("{$date} {$event->end_time}", $timezone);

        if ($now->lessThan($start)) return EventStatus::Scheduled->value;
        if ($now->lessThan($end)) return EventStatus::Ongoing->value;

        return EventStatus::Completed->value;
    }

    public function synchronize(Event $event, DateTimeInterface|string|null $at = null): ?array
    {
        $from = $event->status;
        $to = $this->statusAt($event, $at);
        if ($from === $to) return null;

        $event->update(['status' => $to]);

        return ['event_id' => $event->id, 'from' => $from, 'to' => $to];
    }

    public function synchronizeAll(DateTimeInterface|string|null $at = null): array
    {
        $changes = [];
        Event::query()->whereIn('status', self::ELIGIBLE)->whereNotNull('event_date')
            ->whereNotNull('start_time')->whereNotNull('end_time')->orderBy('id')
            ->chunkById(200, function ($events) use (&$changes, $at): void {
                foreach ($events as $event) if ($change = $this->synchronize($event, $at)) $changes[] = $change;
            });

        return $changes;
    }
}
