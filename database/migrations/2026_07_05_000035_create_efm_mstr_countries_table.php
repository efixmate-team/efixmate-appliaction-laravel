<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_countries', function (Blueprint $table) {
            $table->increments('country_id');
            $table->string('country_name', 100);
            $table->string('country_code', 10);
            $table->string('dial_code', 10)->nullable();
            $table->unsignedInteger('currency_id')->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->json('language_ids')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('timezone_ids')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->boolean('is_deleted')->default(false);
            $table->unique(['country_code'], 'efm_mstr_countries_country_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_countries');
    }
};
