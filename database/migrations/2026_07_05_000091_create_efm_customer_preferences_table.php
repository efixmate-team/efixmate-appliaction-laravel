<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_preferences', function (Blueprint $table) {
            $table->increments('customer_id');
            $table->string('language_code', 10)->default("en")->nullable();
            $table->string('theme', 20)->default("system")->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_preferences');
    }
};
