<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_refunds', function (Blueprint $table) {
            $table->increments('refund_id');
            $table->unsignedInteger('payment_id');
            $table->string('gateway_refund_id', 255);
            $table->decimal('amount', 10, 2);
            $table->text('reason')->nullable();
            $table->unsignedInteger('refund_status_id')->nullable();
            $table->dateTime('refunded_at', 6)->nullable();
            $table->json('raw_response');
            $table->dateTime('created_at', 6);
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
        Schema::dropIfExists('efm_refunds');
    }
};
