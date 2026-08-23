<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('reminder_type')->nullable()->after('event_id');
            $table->unique(['event_id', 'user_id', 'reminder_type']);
        });

        DB::table('reminders')
            ->select('event_id', 'reminder_type', 'channel', 'recipient', DB::raw('MIN(id) as keep_id'))
            ->groupBy('event_id', 'reminder_type', 'channel', 'recipient')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->each(function ($duplicate) {
                DB::table('reminders')
                    ->where('event_id', $duplicate->event_id)
                    ->where('reminder_type', $duplicate->reminder_type)
                    ->where('channel', $duplicate->channel)
                    ->where('recipient', $duplicate->recipient)
                    ->where('id', '!=', $duplicate->keep_id)
                    ->delete();
            });

        Schema::table('reminders', function (Blueprint $table) {
            $table->unique(['event_id', 'reminder_type', 'channel', 'recipient']);
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'reminder_type', 'channel', 'recipient']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'user_id', 'reminder_type']);
            $table->dropColumn('reminder_type');
        });
    }
};
