<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_pricing_snapshot', function (Blueprint $table) {
            $table->id('snapshot_id');
            $table->unsignedInteger('booking_id');
            $table->decimal('base_price', 12, 2);
            $table->json('matched_rules')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->decimal('area_adjustment', 12, 2)->default(0);
            $table->decimal('slot_adjustment', 12, 2)->default(0);
            $table->decimal('surge_charge', 12, 2)->default(0);
            $table->json('discounts')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('taxes')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('coupon_data')->nullable();
            $table->decimal('subtotal_before_tax', 12, 2);
            $table->decimal('final_price', 12, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->string('currency', 3)->default("INR");
            $table->decimal('locked_price', 12, 2)->nullable();
            $table->uuid('lock_id')->nullable();
            $table->string('engine_version', 32)->default("pricing-runtime-v1");
            $table->json('pricing_context')->nullable();
            $table->json('lines_snapshot')->nullable();
            $table->json('service_snapshot')->nullable();
            $table->json('slot_snapshot')->nullable();
            $table->json('charge_snapshot')->nullable();
            $table->json('technician_snapshot')->nullable();
            $table->string('pricing_rules_fingerprint', 64)->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_booking_pricing_snapshot_booking_id_unique');
            $table->index(['created_at'], 'efm_booking_pricing_snapshot_created_at_index');
            $table->index(['fy_id'], 'efm_booking_pricing_snapshot_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_pricing_snapshot');
    }
};
