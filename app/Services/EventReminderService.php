<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\ReminderType;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\Reminder;
use App\Mail\EventReminderMail;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EventReminderService
{
    public function __construct(private readonly ReminderMessageBuilder $messages) {}

    public function processDue(?CarbonImmutable $at = null): array
    {
        $now = ($at ?? now()->toImmutable())->setTimezone(config('app.timezone'));
        $events = Event::query()
            ->whereBetween('event_date', [$now->toDateString(), $now->addDays(3)->toDateString()])
            ->get();
        $due = 0;
        $diagnostics = [];

        foreach ($events as $event) {
            if ($event->status !== EventStatus::Scheduled->value) {
                foreach (ReminderType::cases() as $type) {
                    $target = $this->scheduledAt($event, $type);
                    $diagnostics[] = ['event_id' => $event->id, 'event_name' => $event->event_name, 'target_type' => $type->value, 'target_time' => $target->format('Y-m-d H:i:s'), 'eligibility_time' => $this->eligibilityAt($event)->format('Y-m-d H:i:s'), 'current_time' => $now->format('Y-m-d H:i:s'), 'decision' => 'INELIGIBLE_STATUS'];
                }
                continue;
            }
            foreach (ReminderType::cases() as $type) {
                $scheduledAt = $this->scheduledAt($event, $type);
                $decision = $this->decision($event, $scheduledAt, $now);
                if ($decision === 'DUE') {
                    $sent = $this->send($event, $type, $scheduledAt);
                    $decision = $sent->isNotEmpty() ? 'SENT' : 'ALREADY_SENT';
                    $due += $sent->isNotEmpty() ? 1 : 0;
                }
                $diagnostics[] = ['event_id' => $event->id, 'event_name' => $event->event_name, 'target_type' => $type->value, 'target_time' => $scheduledAt->format('Y-m-d H:i:s'), 'eligibility_time' => $this->eligibilityAt($event)->format('Y-m-d H:i:s'), 'current_time' => $now->format('Y-m-d H:i:s'), 'decision' => $decision];
            }
        }

        return ['events_checked' => $events->count(), 'reminders_due' => $due, 'diagnostics' => $diagnostics];
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
        $event->load(['staff', 'creator', 'venue', 'approvals']);
        $content = $this->messages->build($event, $type);

        $scheduledAt ??= $this->scheduledAt($event, $type);

        $recipients = $event->staff
            ->filter(fn ($user) => CarbonImmutable::parse($user->pivot->created_at, config('app.timezone'))->lessThanOrEqualTo($scheduledAt))
            ->push($event->creator)
            ->filter(fn ($user) => $user && $user->is_active && $user->email)
            ->unique('id');

        return $recipients->filter(function ($user) use ($event, $type, $content, $scheduledAt) {
            return DB::transaction(function () use ($user, $event, $type, $content, $scheduledAt) {
                $notification = AppNotification::firstOrCreate(
                    ['user_id' => $user->id, 'event_id' => $event->id, 'reminder_type' => $type->value],
                    $content,
                );
                $delivery = $this->recordChannelReminder($event, $type, 'EMAIL', $user->email, $scheduledAt);

                if ($delivery->wasRecentlyCreated) {
                    Mail::to($user)->queue(new EventReminderMail($content, $event));
                }

                return $notification->wasRecentlyCreated || $delivery->wasRecentlyCreated;
            });
        })->values();
    }

    private function decision(Event $event, CarbonImmutable $target, CarbonImmutable $now): string
    {
        $eligibleAt = $this->eligibilityAt($event);
        if ($target->lessThan($eligibleAt)) return 'SKIPPED_BEFORE_ELIGIBILITY';
        if ($now->lessThan($target)) return 'FUTURE';
        if ($now->greaterThan($target->addMinutes((int) config('reminders.grace_minutes', 30)))) return 'STALE_OUTSIDE_GRACE';
        return 'DUE';
    }

    private function eligibilityAt(Event $event): CarbonImmutable
    {
        $eligibleAt = $event->approvals()
            ->where('status', 'APPROVED')
            ->whereNotNull('approved_at')
            ->latest('approved_at')
            ->value('approved_at');
        return CarbonImmutable::parse($eligibleAt ?? $event->created_at, config('app.timezone'));
    }

    private function recordChannelReminder(Event $event, ReminderType $type, string $channel, string $recipient, CarbonImmutable $scheduledAt): Reminder
    {
        return Reminder::firstOrCreate(
            ['event_id' => $event->id, 'reminder_type' => $type->value, 'channel' => $channel, 'recipient' => $recipient],
            ['scheduled_at' => $scheduledAt, 'status' => 'QUEUED', 'sent_at' => now()],
        );
    }
}
