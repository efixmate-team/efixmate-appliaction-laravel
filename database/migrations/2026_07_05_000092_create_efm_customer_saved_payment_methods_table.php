<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_saved_payment_methods', function (Blueprint $table) {
            $table->id('method_id');
            $table->unsignedInteger('customer_id');
            $table->string('provider', 40)->default("razorpay");
            $table->string('method_type', 30);
            $table->string('token_ref', 255);
            $table->string('label', 120)->nullable();
            $table->json('meta')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'is_active'], 'efm_customer_saved_payment_methods_customer_id_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_saved_payment_methods');
    }
};
