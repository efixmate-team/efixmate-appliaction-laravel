<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_ledger_entries', function (Blueprint $table) {
            $table->id('entry_id');
            $table->uuid('transaction_id');
            $table->string('debit_account', 32);
            $table->string('credit_account', 32);
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default("INR");
            $table->string('reference_type', 40);
            $table->string('reference_id', 64);
            $table->string('transaction_type', 40);
            $table->json('meta')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['fy_id', 'country_id'], 'efm_ledger_entries_fy_id_country_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_ledger_entries');
    }
};
