<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_start_otp', function (Blueprint $table) {
            $table->increments('booking_id');
            $table->unsignedInteger('technician_id');
            $table->string('otp_hash', 128);
            $table->dateTime('expires_at', 6);
            $table->dateTime('verified_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_start_otp');
    }
};
