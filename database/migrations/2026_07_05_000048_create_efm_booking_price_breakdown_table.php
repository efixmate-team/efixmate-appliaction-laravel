<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_price_breakdown', function (Blueprint $table) {
            $table->id('breakdown_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedBigInteger('snapshot_id')->nullable();
            $table->string('currency', 3)->default("INR");
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('base_price', 14, 2)->default(0);
            $table->decimal('area_amount', 14, 2)->default(0);
            $table->decimal('slot_amount', 14, 2)->default(0);
            $table->decimal('surge_amount', 14, 2)->default(0);
            $table->decimal('technician_charges', 14, 2)->default(0);
            $table->decimal('platform_fees', 14, 2)->default(0);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('coupon_amount', 14, 2)->default(0);
            $table->decimal('commission_amount', 14, 2)->default(0);
            $table->decimal('wallet_deduction', 14, 2)->default(0);
            $table->decimal('cashback_amount', 14, 2)->default(0);
            $table->decimal('subtotal_before_tax', 14, 2)->default(0);
            $table->decimal('customer_payable', 14, 2)->default(0);
            $table->decimal('technician_settlement', 14, 2)->default(0);
            $table->decimal('platform_revenue', 14, 2)->default(0);
            $table->json('lines_meta')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('calculation_meta')->nullable();
            $table->string('schema_version', 16)->default("v2");
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_booking_price_breakdown_booking_id_unique');
            $table->unique(['snapshot_id'], 'efm_booking_price_breakdown_snapshot_id_unique');
            $table->index(['created_at'], 'efm_booking_price_breakdown_created_at_index');
            $table->index(['fy_id'], 'efm_booking_price_breakdown_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_price_breakdown');
    }
};
