<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_pricing_config_versions', function (Blueprint $table) {
            $table->id('version_id');
            $table->string('config_type', 40);
            $table->unsignedInteger('area_id')->nullable();
            $table->json('config')->default("{}");
            $table->unsignedInteger('version_no')->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['config_type', 'area_id', 'is_active'], 'efm_admin_pricing_config_versions_dccf7f40_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_pricing_config_versions');
    }
};
