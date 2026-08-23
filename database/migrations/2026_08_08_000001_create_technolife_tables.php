<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('venues', function (Blueprint $t) { $t->id(); $t->string('name')->unique(); $t->string('location')->nullable(); $t->unsignedInteger('capacity')->nullable(); $t->boolean('is_active')->default(true); $t->timestamps(); });
        Schema::create('events', function (Blueprint $t) {
            $t->id(); $t->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $t->string('event_name')->nullable(); $t->string('event_type')->nullable(); $t->string('custom_event_type')->nullable(); $t->date('event_date')->nullable()->index();
            $t->time('start_time')->nullable(); $t->time('end_time')->nullable(); $t->foreignId('venue_id')->nullable()->constrained()->nullOnDelete(); $t->string('custom_venue')->nullable();
            $t->unsignedInteger('staff_required')->default(0); $t->text('description')->nullable(); $t->text('notes')->nullable();
            $t->string('status')->default('DRAFT')->index(); $t->timestamps(); $t->index(['event_date','start_time','end_time']);
        });
        Schema::create('event_staff', function (Blueprint $t) { $t->id(); $t->foreignId('event_id')->constrained()->cascadeOnDelete(); $t->foreignId('user_id')->constrained('users')->cascadeOnDelete(); $t->timestamps(); $t->unique(['event_id','user_id']); });
        Schema::create('approvals', function (Blueprint $t) { $t->id(); $t->foreignId('event_id')->constrained()->cascadeOnDelete(); $t->foreignId('approver_id')->constrained('users')->restrictOnDelete(); $t->string('status'); $t->text('rejection_reason')->nullable(); $t->timestamp('approved_at')->nullable(); $t->timestamps(); });
        Schema::create('notifications', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('event_id')->nullable()->constrained()->cascadeOnDelete(); $t->string('title'); $t->text('message'); $t->timestamp('read_at')->nullable(); $t->timestamps(); $t->index(['user_id','read_at']); });
        Schema::create('reminders', function (Blueprint $t) { $t->id(); $t->foreignId('event_id')->constrained()->cascadeOnDelete(); $t->string('reminder_type'); $t->timestamp('scheduled_at'); $t->string('channel'); $t->string('recipient'); $t->string('status')->default('PENDING'); $t->timestamp('sent_at')->nullable(); $t->timestamps(); $t->index(['status','scheduled_at']); });
    }
    public function down(): void { Schema::dropIfExists('reminders'); Schema::dropIfExists('notifications'); Schema::dropIfExists('approvals'); Schema::dropIfExists('event_staff'); Schema::dropIfExists('events'); Schema::dropIfExists('venues'); }
};
