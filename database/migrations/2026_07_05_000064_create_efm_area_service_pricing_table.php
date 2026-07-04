<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_area_service_pricing', function (Blueprint $table) {
            $table->unsignedInteger('area_id');
            $table->unsignedInteger('service_id');
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->nullable();
            $table->decimal('final_price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->primary(['area_id', 'service_id']);
            $table->index(['area_id'], 'efm_area_service_pricing_area_id_index');
            $table->index(['service_id'], 'efm_area_service_pricing_service_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_area_service_pricing');
    }
};
