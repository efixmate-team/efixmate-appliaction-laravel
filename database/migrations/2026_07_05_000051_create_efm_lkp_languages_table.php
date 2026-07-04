<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_lkp_languages', function (Blueprint $table) {
            $table->increments('language_id');
            $table->string('language_name', 100);
            $table->string('language_code', 10);
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['language_code'], 'efm_lkp_languages_language_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_lkp_languages');
    }
};
