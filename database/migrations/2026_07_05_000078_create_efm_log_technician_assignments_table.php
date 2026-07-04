<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_log_technician_assignments', function (Blueprint $table) {
            $table->increments('log_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id')->nullable();
            $table->string('type', 20);
            $table->unsignedInteger('attempt_no')->default(1);
            $table->string('action', 20);
            $table->text('reason')->nullable();
            $table->json('payload')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'technician_id'], 'efm_log_technician_assignments_booking_id_technician_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_log_technician_assignments');
    }
};
