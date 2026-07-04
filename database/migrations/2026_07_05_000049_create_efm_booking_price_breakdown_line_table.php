<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_price_breakdown_line', function (Blueprint $table) {
            $table->id('line_id');
            $table->unsignedBigInteger('breakdown_id');
            $table->unsignedInteger('booking_id');
            $table->string('line_type', 32);
            $table->string('line_category', 24)->default("PRICING");
            $table->string('direction', 8)->default("DEBIT");
            $table->decimal('amount', 14, 2);
            $table->string('rate_type', 20)->nullable();
            $table->decimal('rate_value', 12, 4)->nullable();
            $table->string('ref_type', 40)->nullable();
            $table->string('ref_id', 64)->nullable();
            $table->string('label', 150);
            $table->string('description', 255)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('meta')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id'], 'efm_booking_price_breakdown_line_booking_id_index');
            $table->index(['breakdown_id'], 'efm_booking_price_breakdown_line_breakdown_id_index');
            $table->index(['booking_id', 'line_type'], 'efm_booking_price_breakdown_line_booking_id_line_type_index');
            $table->index(['line_category', 'direction'], 'efm_booking_price_breakdown_line_line_category_direction_index');
            $table->index(['fy_id'], 'efm_booking_price_breakdown_line_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_price_breakdown_line');
    }
};
