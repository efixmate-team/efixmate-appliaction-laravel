<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_materials', function (Blueprint $table) {
            $table->id('material_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->string('name', 200);
            $table->decimal('quantity', 10, 2)->default(1)->nullable();
            $table->decimal('unit_cost', 12, 2)->default(0)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_materials');
    }
};
