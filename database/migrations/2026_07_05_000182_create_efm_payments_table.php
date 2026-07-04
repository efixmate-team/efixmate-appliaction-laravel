<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->string('payment_uid', 128);
            $table->unsignedInteger('booking_id');
            $table->string('gateway', 40)->default("razorpay");
            $table->string('gateway_txn_id', 200)->nullable();
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default("INR");
            $table->string('status', 30)->default("pending");
            $table->string('payment_mode', 40)->nullable();
            $table->unsignedInteger('payment_status_id')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('initiated_at', 6)->useCurrent();
            $table->dateTime('completed_at', 6)->nullable();
            $table->dateTime('failed_at', 6)->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['payment_uid'], 'efm_payments_payment_uid_unique');
            $table->index(['booking_id', 'initiated_at'], 'efm_payments_booking_id_initiated_at_index');
            $table->index(['payment_status_id', 'created_at'], 'efm_payments_payment_status_id_created_at_index');
            $table->index(['fy_id', 'country_id'], 'efm_payments_fy_id_country_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_payments');
    }
};
