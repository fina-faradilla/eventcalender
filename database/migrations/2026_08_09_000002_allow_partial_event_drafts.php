<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('events',function(Blueprint $t){$t->string('event_name')->nullable()->change();$t->string('event_type')->nullable()->change();$t->date('event_date')->nullable()->change();$t->time('start_time')->nullable()->change();$t->time('end_time')->nullable()->change();});}public function down():void{}};
