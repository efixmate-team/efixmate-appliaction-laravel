<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_ledger_accounts', function (Blueprint $table) {
            $table->uuid('account_code')->primary();
            $table->string('account_name', 120);
            $table->string('account_type', 32);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_ledger_accounts');
    }
};
