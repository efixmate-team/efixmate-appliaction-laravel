<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_log_payments', function (Blueprint $table) {
            $table->increments('log_id');
            $table->unsignedInteger('booking_id');
            $table->string('payment_id', 100)->nullable();
            $table->string('gateway_type', 20)->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default("INR");
            $table->string('status', 20);
            $table->json('gateway_res')->nullable();
            $table->string('webhook_event', 100)->nullable();
            $table->unsignedInteger('attempt_no')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'payment_id'], 'efm_log_payments_booking_id_payment_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_log_payments');
    }
};
