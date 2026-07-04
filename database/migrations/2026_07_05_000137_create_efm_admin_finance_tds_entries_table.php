<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_finance_tds_entries', function (Blueprint $table) {
            $table->id('tds_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->unsignedInteger('payment_id')->nullable();
            $table->unsignedInteger('technician_id')->nullable();
            $table->unsignedInteger('payout_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->decimal('gross_amount', 14, 2);
            $table->decimal('tds_rate', 5, 2)->default(1);
            $table->decimal('tds_amount', 14, 2);
            $table->string('section_code', 20)->default("194C")->nullable();
            $table->string('financial_year', 10)->nullable();
            $table->string('period_month', 7)->nullable();
            $table->string('status', 20)->default("accrued");
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['period_month', 'technician_id'], 'efm_admin_finance_tds_entries_period_month_technician_id_index');
            $table->index(['fy_id'], 'efm_admin_finance_tds_entries_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_finance_tds_entries');
    }
};
