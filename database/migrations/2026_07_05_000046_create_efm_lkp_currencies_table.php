<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_lkp_currencies', function (Blueprint $table) {
            $table->increments('currency_id');
            $table->string('currency_name', 100);
            $table->string('currency_code', 10);
            $table->string('currency_symbol', 5)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['currency_code'], 'efm_lkp_currencies_currency_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_lkp_currencies');
    }
};
