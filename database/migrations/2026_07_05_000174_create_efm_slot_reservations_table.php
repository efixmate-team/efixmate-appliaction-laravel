<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_slot_reservations', function (Blueprint $table) {
            $table->uuid('reservation_id')->primary();
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('slot_id');
            $table->date('scheduled_date');
            $table->string('scheduled_time', 32);
            $table->unsignedInteger('customer_id');
            $table->uuid('lock_id')->nullable();
            $table->unsignedInteger('reserved_units')->default(1);
            $table->dateTime('reserved_until', 6);
            $table->string('status', 16)->default("HELD");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_slot_reservations');
    }
};
