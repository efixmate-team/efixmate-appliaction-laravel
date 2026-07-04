<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_dispatch_job_offers', function (Blueprint $table) {
            $table->increments('offer_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('wave')->default(1);
            $table->string('status', 20);
            $table->dateTime('expires_at', 6);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'status'], 'efm_dispatch_job_offers_booking_id_status_index');
            $table->index(['technician_id', 'status'], 'efm_dispatch_job_offers_technician_id_status_index');
            $table->unique(['booking_id', 'technician_id', 'wave'], 'efm_dispatch_job_offers_booking_id_technician_id_wave_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_dispatch_job_offers');
    }
};
