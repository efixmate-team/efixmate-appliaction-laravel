<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_settlement_item', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id')->nullable();
            $table->string('item_type', 32);
            $table->string('direction', 8)->default("CREDIT");
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default("INR");
            $table->string('status', 20)->default("PENDING");
            $table->unsignedBigInteger('settlement_batch_id')->nullable();
            $table->unsignedInteger('payout_id')->nullable();
            $table->string('ref_type', 40)->nullable();
            $table->string('ref_id', 64)->nullable();
            $table->json('meta')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('settled_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id'], 'efm_booking_settlement_item_booking_id_index');
            $table->index(['technician_id', 'status', 'created_at'], 'efm_booking_settlement_item_8d1f0726_index');
            $table->index(['settlement_batch_id'], 'efm_booking_settlement_item_settlement_batch_id_index');
            $table->index(['item_type', 'status'], 'efm_booking_settlement_item_item_type_status_index');
            $table->index(['fy_id', 'country_id'], 'efm_booking_settlement_item_fy_id_country_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_settlement_item');
    }
};
