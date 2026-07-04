<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_payment_orders', function (Blueprint $table) {
            $table->increments('order_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('fy_id')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 12)->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->unsignedInteger('booking_type_id')->nullable();
            $table->string('gateway_order_id', 255)->nullable();
            $table->unsignedInteger('payment_status_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['fy_id'], 'efm_payment_orders_fy_id_index');
            $table->index(['country_id', 'state_id', 'city_id', 'area_id'], 'efm_payment_orders_country_id_state_id_city_id_area_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_payment_orders');
    }
};
