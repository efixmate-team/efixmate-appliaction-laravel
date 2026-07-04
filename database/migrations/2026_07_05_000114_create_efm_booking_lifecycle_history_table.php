<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_lifecycle_history', function (Blueprint $table) {
            $table->id('history_id');
            $table->unsignedInteger('booking_id');
            $table->string('from_state', 40)->nullable();
            $table->string('to_state', 40);
            $table->string('changed_by', 80);
            $table->string('user_type', 20)->nullable();
            $table->json('meta')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'created_at'], 'efm_booking_lifecycle_history_booking_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_lifecycle_history');
    }
};
