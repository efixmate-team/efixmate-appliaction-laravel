<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_taxes', function (Blueprint $table) {
            $table->increments('tax_id');
            $table->string('tax_name', 100);
            $table->decimal('tax_percentage', 5, 2);
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_taxes');
    }
};
