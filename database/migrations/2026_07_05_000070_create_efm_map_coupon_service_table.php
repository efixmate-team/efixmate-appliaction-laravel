<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_coupon_service', function (Blueprint $table) {
            $table->increments('map_id');
            $table->unsignedInteger('coupon_id');
            $table->unsignedInteger('service_id')->nullable();
            $table->unsignedInteger('category_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_coupon_service');
    }
};
