<?php

namespace App\Services;

use App\Mail\AdminOperationalNotificationMail;
use App\Models\AppNotification;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class AdminNotificationService
{
    public function eventSubmitted(Event $event, User $pic, bool $resubmitted = false): void
    {
        $this->send($event, [
            'title' => $resubmitted ? 'Acara diajukan ulang' : 'Pengajuan acara baru',
            'message' => $resubmitted
                ? "{$pic->name} telah memperbarui dan mengajukan ulang acara \"{$event->event_name}\"."
                : "{$pic->name} mengajukan acara \"{$event->event_name}\" untuk ditinjau.",
        ]);
    }

    public function eventDecided(Event $event, User $approver, bool $approved): void
    {
        $action = $approved ? 'telah disetujui' : 'ditolak';
        $this->send($event, [
            'title' => $approved ? 'Acara disetujui' : 'Acara ditolak',
            'message' => "Acara \"{$event->event_name}\" {$action} oleh {$approver->name}.",
        ]);
    }

    public function staffAssignmentUpdated(Event $event): void
    {
        $this->send($event, [
            'title' => 'Penugasan staf diperbarui',
            'message' => "Penugasan staf untuk acara \"{$event->event_name}\" telah diperbarui.",
        ]);
    }

    public function eventCancelled(Event $event): void
    {
        $this->send($event, [
            'title' => 'Acara dibatalkan',
            'message' => "Acara \"{$event->event_name}\" telah dibatalkan.",
        ]);
    }

    private function send(Event $event, array $content): void
    {
        User::query()
            ->where('role', 'ADMIN')
            ->where('is_active', true)
            ->each(function (User $admin) use ($event, $content): void {
                AppNotification::create([
                    'user_id' => $admin->id,
                    'event_id' => $event->id,
                    'title' => $content['title'],
                    'message' => $content['message'],
                ]);

                Mail::to($admin->email)->queue(new AdminOperationalNotificationMail($content, $event));
            });
    }
}
