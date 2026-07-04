<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_settlement_batches', function (Blueprint $table) {
            $table->id('batch_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('status', 30)->default("pending");
            $table->decimal('total_amount', 14, 2)->default(0)->nullable();
            $table->unsignedInteger('technician_count')->default(0)->nullable();
            $table->decimal('commission_total', 14, 2)->default(0)->nullable();
            $table->decimal('tds_total', 14, 2)->default(0)->nullable();
            $table->decimal('gst_total', 14, 2)->default(0)->nullable();
            $table->decimal('gross_payout_total', 14, 2)->default(0)->nullable();
            $table->decimal('net_payout_total', 14, 2)->default(0)->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->unsignedInteger('processed_by')->nullable();
            $table->dateTime('processed_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['created_at'], 'efm_admin_settlement_batches_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_settlement_batches');
    }
};
