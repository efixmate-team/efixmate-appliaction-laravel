<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_technicians', function (Blueprint $table) {
            $table->increments('asignment_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('booking_id');
            $table->string('assignment_role', 30)->default("primary")->nullable();
            $table->boolean('is_primary')->default(false);
            $table->dateTime('assigned_at', 6)->nullable();
            $table->dateTime('started_at', 6)->nullable();
            $table->dateTime('completed_at', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_technicians');
    }
};
