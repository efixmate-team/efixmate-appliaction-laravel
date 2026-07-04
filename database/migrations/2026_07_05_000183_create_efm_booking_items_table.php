<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('booking_type_id')->nullable();
            $table->unsignedInteger('unit_id')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->unsignedInteger('display_order')->default(0);
            $table->text('technician_notes')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'display_order'], 'efm_booking_items_booking_id_display_order_index');
            $table->index(['fy_id'], 'efm_booking_items_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_items');
    }
};
