<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_payouts', function (Blueprint $table) {
            $table->increments('payout_id');
            $table->unsignedInteger('technician_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('payout_method', 50)->nullable();
            $table->string('status', 50)->default("PENDING")->nullable();
            $table->string('vendor_type', 30)->default("technician")->nullable();
            $table->unsignedInteger('vendor_id')->nullable();
            $table->unsignedBigInteger('settlement_batch_id')->nullable();
            $table->string('reference_no', 80)->nullable();
            $table->decimal('tds_amount', 12, 2)->default(0)->nullable();
            $table->unsignedInteger('booking_id')->nullable();
            $table->decimal('gross_amount', 14, 2)->nullable();
            $table->decimal('net_amount', 14, 2)->nullable();
            $table->decimal('commission_amount', 14, 2)->default(0)->nullable();
            $table->decimal('gst_amount', 14, 2)->default(0)->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('processed_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['status', 'created_at'], 'efm_payouts_status_created_at_index');
            $table->index(['technician_id', 'settlement_batch_id'], 'efm_payouts_technician_id_settlement_batch_id_index');
            $table->index(['fy_id', 'country_id'], 'efm_payouts_fy_id_country_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_payouts');
    }
};
