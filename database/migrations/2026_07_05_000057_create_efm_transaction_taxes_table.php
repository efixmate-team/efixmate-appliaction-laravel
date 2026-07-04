<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_transaction_taxes', function (Blueprint $table) {
            $table->increments('tax_log_id');
            $table->string('transaction_id', 100);
            $table->decimal('tax_amount', 10, 2);
            $table->string('tax_type', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_transaction_taxes');
    }
};
