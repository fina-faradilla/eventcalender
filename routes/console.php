<?php

use App\Services\EventLifecycleService;
use App\Services\EventReminderService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('events:sync-status', function (EventLifecycleService $lifecycle) {
    $changes = $lifecycle->synchronizeAll();
    $transitions = collect($changes)->countBy(fn (array $change) => "{$change['from']} -> {$change['to']}");

    $this->info('Sinkronisasi lifecycle acara selesai.');
    $reported = ['SCHEDULED -> ONGOING', 'SCHEDULED -> COMPLETED', 'ONGOING -> COMPLETED'];
    foreach ($reported as $transition) {
        $this->line("{$transition}: ".($transitions[$transition] ?? 0));
    }
    foreach ($transitions as $transition => $count) {
        if (! in_array($transition, $reported, true)) {
            $this->line("{$transition}: {$count}");
        }
    }
    $this->line('Total perubahan: '.count($changes));
})->purpose('Synchronize operational event statuses from their Jakarta date and time');

Artisan::command('events:send-reminders', function (EventReminderService $reminders) {
    $result = $reminders->processDue();
    $this->info('Pemeriksaan pengingat acara selesai.');
    $this->line('Acara diperiksa: '.$result['events_checked']);
    $this->line('Pengingat jatuh tempo: '.$result['reminders_due']);
})->purpose('Send event reminders that are due in the current Jakarta time window');

Schedule::command('events:sync-status')->everyMinute()->withoutOverlapping();
Schedule::command('events:send-reminders')->everyMinute()->withoutOverlapping();
