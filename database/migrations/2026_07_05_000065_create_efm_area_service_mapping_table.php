<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_area_service_mapping', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('service_id');
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6);
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_id', 'service_id'], 'efm_area_service_mapping_area_id_service_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_area_service_mapping');
    }
};
