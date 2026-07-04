<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_discounts', function (Blueprint $table) {
            $table->increments('discount_id');
            $table->string('discount_title', 150);
            $table->string('discount_type', 20)->default("PERCENTAGE")->nullable();
            $table->decimal('discount_value', 10, 2);
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('target_id')->nullable();
            $table->string('target_type', 50)->default("GLOBAL");
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_discounts');
    }
};
