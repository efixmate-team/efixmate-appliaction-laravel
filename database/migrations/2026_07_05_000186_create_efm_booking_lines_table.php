<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_lines', function (Blueprint $table) {
            $table->id('line_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->unsignedInteger('booking_type_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id'], 'efm_booking_lines_booking_id_index');
            $table->index(['service_id'], 'efm_booking_lines_service_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_lines');
    }
};
