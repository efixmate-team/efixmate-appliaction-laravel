<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_payment_webhook_events', function (Blueprint $table) {
            $table->uuid('event_id')->primary();
            $table->string('gateway', 40)->default("razorpay");
            $table->json('payload');
            $table->dateTime('processed_at', 6)->nullable();
            $table->string('status', 30)->default("received");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_payment_webhook_events');
    }
};
