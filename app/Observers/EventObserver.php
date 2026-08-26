<?php

namespace App\Observers;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Services\AdminNotificationService;

class EventObserver
{
    public function updated(Event $event): void
    {
        if ($event->wasChanged('status') && $event->status === EventStatus::Cancelled->value) {
            app(AdminNotificationService::class)->eventCancelled($event);
        }
    }
}
