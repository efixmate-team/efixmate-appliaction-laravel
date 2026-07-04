<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_job_bids', function (Blueprint $table) {
            $table->id('bid_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('technician_id');
            $table->decimal('bid_amount', 12, 2)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 30)->default("pending");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id', 'technician_id'], 'efm_technician_job_bids_booking_id_technician_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_job_bids');
    }
};
