<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_clv_metrics', function (Blueprint $table) {
            $table->increments('customer_id');
            $table->decimal('lifetime_value', 14, 2)->default(0);
            $table->unsignedInteger('total_bookings')->default(0);
            $table->unsignedInteger('completed_bookings')->default(0);
            $table->decimal('total_paid', 14, 2)->default(0);
            $table->decimal('avg_order_value', 12, 2)->default(0);
            $table->dateTime('first_booking_at', 6)->nullable();
            $table->dateTime('last_booking_at', 6)->nullable();
            $table->dateTime('computed_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_clv_metrics');
    }
};
