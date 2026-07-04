<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_tracking_sessions', function (Blueprint $table) {
            $table->id('session_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->boolean('is_active')->default(true);
            $table->decimal('last_lat', 9, 6)->nullable();
            $table->decimal('last_lng', 9, 6)->nullable();
            $table->dateTime('last_updated', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'is_active'], 'efm_tracking_sessions_booking_id_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_tracking_sessions');
    }
};
