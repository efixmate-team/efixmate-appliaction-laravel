<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_gateway_payment', function (Blueprint $table) {
            $table->increments('payment_id');
            $table->unsignedInteger('order_id');
            $table->string('gateway_payment_id', 255)->nullable();
            $table->text('gateway_signature')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 12)->default("INR")->nullable();
            $table->unsignedInteger('payment_mode_id')->nullable();
            $table->unsignedInteger('payment_status_id')->nullable();
            $table->dateTime('paid_at', 6)->nullable();
            $table->json('raw_response')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_gateway_payment');
    }
};
