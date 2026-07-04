<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_locks', function (Blueprint $table) {
            $table->uuid('lock_id')->primary();
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('slot_id');
            $table->dateTime('scheduled_date', 6);
            $table->decimal('locked_price', 10, 2);
            $table->string('coupon_code', 50)->nullable();
            $table->string('status', 20)->default("ACTIVE");
            $table->string('lock_status', 20)->nullable();
            $table->dateTime('expires_at', 6);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['area_id', 'slot_id', 'scheduled_date'], 'efm_booking_locks_area_id_slot_id_scheduled_date_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_locks');
    }
};
