<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_signatures', function (Blueprint $table) {
            $table->id('signature_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->string('signature_url', 500);
            $table->dateTime('signed_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_signatures');
    }
};
