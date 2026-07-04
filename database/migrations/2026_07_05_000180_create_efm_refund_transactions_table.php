<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_refund_transactions', function (Blueprint $table) {
            $table->id('refund_tx_id');
            $table->unsignedInteger('booking_id');
            $table->string('gateway_refund_id', 128)->nullable();
            $table->string('refund_type', 20)->default("FULL");
            $table->decimal('amount', 14, 2);
            $table->string('status', 20)->default("PENDING");
            $table->text('reason')->nullable();
            $table->string('processed_by', 64)->nullable();
            $table->unsignedInteger('legacy_refund_id')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_refund_transactions');
    }
};
