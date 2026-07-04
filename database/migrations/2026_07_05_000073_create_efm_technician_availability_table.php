<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_availability', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('slot_id');
            $table->boolean('is_available')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6);
            $table->boolean('is_deleted')->default(false);
            $table->unique(['technician_id', 'area_id', 'slot_id'], 'efm_technician_availability_technician_id_area_id_slot_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_availability');
    }
};
