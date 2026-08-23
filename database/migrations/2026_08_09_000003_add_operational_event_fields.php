<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('participants_count')->nullable()->after('custom_venue');
        });
        Schema::table('venues', function (Blueprint $table) {
            $table->string('type')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('events', fn (Blueprint $table) => $table->dropColumn('participants_count'));
        Schema::table('venues', fn (Blueprint $table) => $table->dropColumn('type'));
    }
};
