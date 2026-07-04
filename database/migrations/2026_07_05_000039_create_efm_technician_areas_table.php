<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_areas', function (Blueprint $table) {
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('area_id');
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12)->default("system");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->primary(['technician_id', 'area_id']);
            $table->index(['area_id'], 'efm_technician_areas_area_id_index');
            $table->index(['technician_id'], 'efm_technician_areas_technician_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_areas');
    }
};
