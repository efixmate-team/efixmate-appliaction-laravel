<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_areas', function (Blueprint $table) {
            $table->increments('area_id');
            $table->string('area_name', 100);
            $table->unsignedInteger('city_id');
            $table->unsignedInteger('area_type_id')->nullable();
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 9, 6);
            $table->decimal('radius_km', 10, 2);
            $table->json('polygon_coordinates')->nullable();
            $table->unsignedInteger('max_active_bookings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_name', 'city_id'], 'efm_mstr_areas_area_name_city_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_areas');
    }
};
