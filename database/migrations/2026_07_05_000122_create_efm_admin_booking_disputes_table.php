<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_booking_disputes', function (Blueprint $table) {
            $table->id('dispute_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('customer_id')->nullable();
            $table->unsignedInteger('technician_id')->nullable();
            $table->string('dispute_type', 40)->default("general");
            $table->string('status', 30)->default("open");
            $table->text('description')->nullable();
            $table->text('resolution')->nullable();
            $table->unsignedInteger('assigned_admin')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'status'], 'efm_admin_booking_disputes_booking_id_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_booking_disputes');
    }
};
