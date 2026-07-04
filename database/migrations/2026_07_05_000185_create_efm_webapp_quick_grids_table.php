<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_webapp_quick_grids', function (Blueprint $table) {
            $table->increments('grid_id');
            $table->string('title', 150);
            $table->string('subtitle', 300)->nullable();
            $table->string('badge', 50)->nullable();
            $table->string('accent', 20)->default("#1d4ed8")->nullable();
            $table->json('items')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_webapp_quick_grids');
    }
};
