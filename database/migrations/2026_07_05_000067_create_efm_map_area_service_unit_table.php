<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_area_service_unit', function (Blueprint $table) {
            $table->increments('map_id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('unit_id');
            $table->decimal('price_per_unit', 10, 2)->nullable();
            $table->decimal('flat_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->string('created_by', 12)->default("SYSTEM")->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->useCurrent()->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_id', 'service_id', 'unit_id'], 'efm_map_area_service_unit_area_id_service_id_unit_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_area_service_unit');
    }
};
