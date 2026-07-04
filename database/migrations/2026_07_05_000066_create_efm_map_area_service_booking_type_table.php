<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_area_service_booking_type', function (Blueprint $table) {
            $table->increments('map_id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('booking_type_id');
            $table->boolean('is_active')->default(true)->nullable();
            $table->string('created_by', 12)->default("SYSTEM")->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->useCurrent()->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_id', 'service_id', 'booking_type_id'], 'efm_map_area_service_booking_type_ab65f2f9_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_area_service_booking_type');
    }
};
