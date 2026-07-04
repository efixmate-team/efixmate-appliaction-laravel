<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_cities', function (Blueprint $table) {
            $table->increments('city_id');
            $table->unsignedInteger('state_id')->nullable();
            $table->string('city_name', 100);
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->string('slug', 120)->nullable();
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['city_name'], 'efm_mstr_cities_city_name_unique');
            $table->index(['slug'], 'efm_mstr_cities_slug_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_cities');
    }
};
