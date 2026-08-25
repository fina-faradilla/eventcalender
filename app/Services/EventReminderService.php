<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\ReminderType;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\Reminder;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EventReminderService
{
    private const DUE_WINDOW_MINUTES = 2;

    public function __construct(private readonly ReminderMessageBuilder $messages) {}

    public function processDue(?CarbonImmutable $at = null): array
    {
        $now = ($at ?? now()->toImmutable())->setTimezone(config('app.timezone'));
        $events = Event::query()
            ->where('status', EventStatus::Scheduled->value)
            ->whereBetween('event_date', [$now->toDateString(), $now->addDays(3)->toDateString()])
            ->get();
        $due = 0;

        foreach ($events as $event) {
            foreach (ReminderType::cases() as $type) {
                $scheduledAt = $this->scheduledAt($event, $type);
                if ($now->greaterThanOrEqualTo($scheduledAt) && $now->lessThan($scheduledAt->addMinutes(self::DUE_WINDOW_MINUTES))) {
                    $this->send($event, $type, $scheduledAt);
                    $due++;
                }
            }
        }

        return ['events_checked' => $events->count(), 'reminders_due' => $due];
    }

    public function scheduledAt(Event $event, ReminderType $type): CarbonImmutable
    {
        $start = CarbonImmutable::parse(
            $event->event_date->format('Y-m-d').' '.substr((string) $event->start_time, 0, 8),
            config('app.timezone'),
        );

        return match ($type) {
            ReminderType::H3 => $start->subDays(3),
            ReminderType::H2 => $start->subDays(2),
            ReminderType::H1 => $start->subDay(),
            ReminderType::H1Hour => $start->subHour(),
        };
    }

    public function send(Event $event, ReminderType $type, ?CarbonImmutable $scheduledAt = null): Collection
    {
        if ($event->status !== EventStatus::Scheduled->value) {
            return collect();
        }

        // Reload assignments so staff removed since a prior scheduler pass are excluded.
        $event->load(['staff', 'creator', 'venue']);
        $content = $this->messages->build($event, $type);

        $scheduledAt ??= $this->scheduledAt($event, $type);

        return DB::transaction(function () use ($event, $type, $content, $scheduledAt) {
            $emailRecipients = collect([$event->creator->email]);
            $whatsAppRecipients = $event->staff->pluck('email')->push($event->creator->email)->filter()->unique();

            foreach ($emailRecipients as $recipient) {
                $this->recordChannelReminder($event, $type, 'EMAIL_MOCK', $recipient, $scheduledAt);
            }
            foreach ($whatsAppRecipients as $recipient) {
                $this->recordChannelReminder($event, $type, 'WHATSAPP_MOCK', $recipient, $scheduledAt);
            }

            return $event->staff->pluck('id')->push($event->created_by)->unique()->map(fn ($userId) => AppNotification::firstOrCreate(
                ['user_id' => $userId, 'event_id' => $event->id, 'reminder_type' => $type->value],
                $content,
            )
            );
        });
    }

    private function recordChannelReminder(Event $event, ReminderType $type, string $channel, string $recipient, CarbonImmutable $scheduledAt): void
    {
        Reminder::firstOrCreate(
            ['event_id' => $event->id, 'reminder_type' => $type->value, 'channel' => $channel, 'recipient' => $recipient],
            ['scheduled_at' => $scheduledAt, 'status' => 'SENT', 'sent_at' => now()],
        );
    }
}
