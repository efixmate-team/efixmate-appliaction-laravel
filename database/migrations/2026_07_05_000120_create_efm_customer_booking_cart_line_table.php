<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_booking_cart_line', function (Blueprint $table) {
            $table->id('line_id');
            $table->uuid('cart_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('booking_type_id')->nullable();
            $table->json('photo_urls')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->unsignedInteger('sort_order')->default(0)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->useCurrent()->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['cart_id', 'service_id'], 'efm_customer_booking_cart_line_cart_id_service_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_booking_cart_line');
    }
};
