<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_service_pricing', function (Blueprint $table) {
            $table->increments('pricing_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('booking_type_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['service_id'], 'efm_service_pricing_service_id_index');
            $table->index(['city_id'], 'efm_service_pricing_city_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_service_pricing');
    }
};
