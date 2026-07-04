<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_status_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('old_status')->nullable();
            $table->unsignedInteger('new_status');
            $table->string('changed_by', 100)->nullable();
            $table->string('user_type', 20)->default("SYSTEM");
            $table->text('remark')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'created_at'], 'idx_bsl_booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_status_logs');
    }
};
