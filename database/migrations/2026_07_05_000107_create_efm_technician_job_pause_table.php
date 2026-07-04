<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_pause', function (Blueprint $table) {
            $table->increments('booking_id');
            $table->unsignedInteger('technician_id');
            $table->dateTime('paused_at', 6)->useCurrent();
            $table->dateTime('resumed_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_pause');
    }
};
