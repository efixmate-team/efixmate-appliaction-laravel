<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_invoices', function (Blueprint $table) {
            $table->increments('invoice_id');
            $table->unsignedInteger('booking_id');
            $table->string('invoice_number', 50);
            $table->decimal('amount', 10, 2);
            $table->string('status', 20)->default("UNPAID")->nullable();
            $table->decimal('taxable_amount', 12, 2)->nullable();
            $table->decimal('gst_amount', 12, 2)->nullable();
            $table->decimal('cgst_amount', 12, 2)->nullable();
            $table->decimal('sgst_amount', 12, 2)->nullable();
            $table->decimal('igst_amount', 12, 2)->nullable();
            $table->decimal('gst_rate', 5, 2)->default(18)->nullable();
            $table->unsignedInteger('customer_id')->nullable();
            $table->unsignedInteger('payment_id')->nullable();
            $table->json('pdf_meta')->default("{}")->nullable();
            $table->unsignedInteger('generated_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['invoice_number'], 'efm_invoices_invoice_number_unique');
            $table->index(['created_at'], 'efm_invoices_created_at_index');
            $table->index(['booking_id'], 'efm_invoices_booking_id_index');
            $table->index(['fy_id'], 'efm_invoices_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_invoices');
    }
};
