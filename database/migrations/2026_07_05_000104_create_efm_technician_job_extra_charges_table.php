<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_extra_charges', function (Blueprint $table) {
            $table->id('charge_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->decimal('amount', 12, 2);
            $table->text('reason')->nullable();
            $table->string('status', 30)->default("pending");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_extra_charges');
    }
};
