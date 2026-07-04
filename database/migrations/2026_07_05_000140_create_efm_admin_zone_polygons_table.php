<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_zone_polygons', function (Blueprint $table) {
            $table->increments('zone_id');
            $table->unsignedInteger('area_id');
            $table->string('zone_name', 120);
            $table->json('polygon');
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_zone_polygons');
    }
};
