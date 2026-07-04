<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_booking_escalations', function (Blueprint $table) {
            $table->id('escalation_id');
            $table->unsignedInteger('booking_id');
            $table->string('level', 20)->default("L1");
            $table->text('reason');
            $table->string('status', 30)->default("open");
            $table->unsignedInteger('escalated_by');
            $table->dateTime('resolved_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'status'], 'efm_admin_booking_escalations_booking_id_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_booking_escalations');
    }
};
