<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cancellation_fee_snapshot', function (Blueprint $table) {
            $table->id('snapshot_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('policy_id')->nullable();
            $table->string('fee_type', 10);
            $table->decimal('fee_value', 10, 2);
            $table->decimal('hours_before', 6, 2);
            $table->string('cancelled_by', 20)->default("CUSTOMER");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_cancellation_fee_snapshot_booking_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cancellation_fee_snapshot');
    }
};
