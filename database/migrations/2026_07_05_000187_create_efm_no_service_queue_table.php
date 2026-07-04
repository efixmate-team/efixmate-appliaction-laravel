<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_no_service_queue', function (Blueprint $table) {
            $table->id('queue_id');
            $table->unsignedInteger('booking_id');
            $table->string('status', 20)->default("PENDING");
            $table->text('note')->nullable();
            $table->dateTime('enqueued_at', 6)->useCurrent();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->unsignedInteger('resolved_by')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_no_service_queue_booking_id_unique');
            $table->index(['status', 'enqueued_at'], 'efm_no_service_queue_status_enqueued_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_no_service_queue');
    }
};
