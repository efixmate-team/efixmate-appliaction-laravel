<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_availability_schedule', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('day_of_week');
            $table->string('start_time', 10);
            $table->string('end_time', 10);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_availability_schedule');
    }
};
