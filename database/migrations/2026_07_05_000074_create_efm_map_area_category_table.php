<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_area_category', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('category_id');
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_id', 'category_id'], 'efm_map_area_category_area_id_category_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_area_category');
    }
};
