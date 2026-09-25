<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'evaluation')) {
                $table->text('evaluation')->nullable()->after('notes');
            }
            if (! Schema::hasColumn('events', 'evaluated_by')) {
                $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete()->after('evaluation');
            }
            if (! Schema::hasColumn('events', 'evaluated_at')) {
                $table->timestamp('evaluated_at')->nullable()->after('evaluated_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'evaluated_by')) {
                $table->dropConstrainedForeignId('evaluated_by');
            }
            if (Schema::hasColumn('events', 'evaluation') || Schema::hasColumn('events', 'evaluated_at')) {
                $table->dropColumn(array_filter([
                    Schema::hasColumn('events', 'evaluation') ? 'evaluation' : null,
                    Schema::hasColumn('events', 'evaluated_at') ? 'evaluated_at' : null,
                ]));
            }
        });
    }
};

