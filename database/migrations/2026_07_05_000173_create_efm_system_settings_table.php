<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_system_settings', function (Blueprint $table) {
            $table->uuid('setting_key')->primary();
            $table->json('setting_value')->default("{}");
            $table->string('updated_by', 50)->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_system_settings');
    }
};
