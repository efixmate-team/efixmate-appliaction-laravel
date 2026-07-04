<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_booking_cart', function (Blueprint $table) {
            $table->uuid('cart_id')->primary();
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('address_id')->nullable();
            $table->unsignedInteger('slot_id')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->string('scheduled_time', 32)->nullable();
            $table->string('instructions', 500)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->useCurrent()->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'is_active'], 'efm_customer_booking_cart_customer_id_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_booking_cart');
    }
};
