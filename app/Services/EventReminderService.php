<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\ReminderType;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\Reminder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EventReminderService
{
    private const ELIGIBLE_STATUSES = [
        EventStatus::Approved->value,
        EventStatus::Scheduled->value,
        EventStatus::Ongoing->value,
    ];

    public function __construct(private readonly ReminderMessageBuilder $messages) {}

    public function send(Event $event, ReminderType $type): Collection
    {
        if (! in_array($event->status, self::ELIGIBLE_STATUSES, true)) {
            return collect();
        }

        // Reload assignments so staff removed since a prior scheduler pass are excluded.
        $event->load(['staff', 'creator', 'venue']);
        $content = $this->messages->build($event, $type);

        return DB::transaction(function () use ($event, $type, $content) {
            $emailRecipients = collect([$event->creator->email]);
            $whatsAppRecipients = $event->staff->pluck('email')->push($event->creator->email)->filter()->unique();

            foreach ($emailRecipients as $recipient) {
                $this->recordChannelReminder($event, $type, 'EMAIL_MOCK', $recipient);
            }
            foreach ($whatsAppRecipients as $recipient) {
                $this->recordChannelReminder($event, $type, 'WHATSAPP_MOCK', $recipient);
            }

            return $event->staff->pluck('id')->push($event->created_by)->unique()->map(fn ($userId) => AppNotification::firstOrCreate(
                ['user_id' => $userId, 'event_id' => $event->id, 'reminder_type' => $type->value],
                $content,
            )
            );
        });
    }

    public static function eligibleStatuses(): array
    {
        return self::ELIGIBLE_STATUSES;
    }

    private function recordChannelReminder(Event $event, ReminderType $type, string $channel, string $recipient): void
    {
        Reminder::firstOrCreate(
            ['event_id' => $event->id, 'reminder_type' => $type->value, 'channel' => $channel, 'recipient' => $recipient],
            ['scheduled_at' => now(), 'status' => 'SENT', 'sent_at' => now()],
        );
    }
}
