<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_favorites', function (Blueprint $table) {
            $table->id('id');
            $table->unsignedInteger('customer_id');
            $table->string('entity_type', 20);
            $table->unsignedInteger('entity_id');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id'], 'efm_customer_favorites_customer_id_index');
            $table->unique(['customer_id', 'entity_type', 'entity_id'], 'efm_customer_favorites_customer_id_entity_type_entity_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_favorites');
    }
};
