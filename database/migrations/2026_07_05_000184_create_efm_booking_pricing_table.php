<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_pricing', function (Blueprint $table) {
            $table->id('pricing_id');
            $table->unsignedInteger('booking_id');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('platform_fee', 12, 2)->default(0);
            $table->decimal('surge_amount', 12, 2)->default(0);
            $table->decimal('manual_discount', 12, 2)->default(0);
            $table->string('coupon_code', 60)->nullable();
            $table->decimal('coupon_discount', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('final_amount', 14, 2)->default(0);
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_booking_pricing_booking_id_unique');
            $table->index(['booking_id'], 'efm_booking_pricing_booking_id_index');
            $table->index(['fy_id'], 'efm_booking_pricing_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_pricing');
    }
};
