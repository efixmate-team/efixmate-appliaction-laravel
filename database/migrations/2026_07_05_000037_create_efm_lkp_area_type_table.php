<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_lkp_area_type', function (Blueprint $table) {
            $table->increments('area_type_id');
            $table->unsignedInteger('order_seq')->default(0);
            $table->string('area_type', 100);
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_lkp_area_type');
    }
};
