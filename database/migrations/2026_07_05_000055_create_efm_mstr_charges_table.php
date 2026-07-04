<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_charges', function (Blueprint $table) {
            $table->increments('charge_id');
            $table->string('charge_name', 100);
            $table->string('charge_type', 20)->default("FIXED");
            $table->decimal('charge_value', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_charges');
    }
};
