<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_time_slots', function (Blueprint $table) {
            $table->increments('slot_id');
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('service_id')->nullable();
            $table->string('name', 100);
            $table->string('start_time', 20);
            $table->string('end_time', 20);
            $table->decimal('surge_multiplier', 5, 2)->default(1);
            $table->unsignedInteger('max_capacity')->nullable();
            $table->boolean('is_instant')->default(false);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6);
            $table->boolean('is_deleted')->default(false);
            $table->index(['area_id', 'service_id'], 'idx_time_slots_area_service_active');
            $table->index(['area_id', 'service_id', 'is_instant'], 'idx_time_slots_area_service_instant');
            $table->index(['area_id', 'start_time', 'end_time'], 'idx_time_slots_area_time_window');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_time_slots');
    }
};
