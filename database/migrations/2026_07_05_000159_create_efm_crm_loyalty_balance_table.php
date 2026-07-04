<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_loyalty_balance', function (Blueprint $table) {
            $table->increments('customer_id');
            $table->unsignedInteger('points_balance')->default(0);
            $table->string('tier', 30)->default("standard");
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_loyalty_balance');
    }
};
