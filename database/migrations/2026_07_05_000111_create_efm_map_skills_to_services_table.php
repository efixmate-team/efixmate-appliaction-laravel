<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_skills_to_services', function (Blueprint $table) {
            $table->increments('map_id');
            $table->unsignedInteger('skill_id');
            $table->unsignedInteger('service_id');
            $table->boolean('is_deleted')->default(false);
            $table->index(['skill_id'], 'idx_skill_svc_skill');
            $table->index(['service_id'], 'idx_skill_svc_service');
            $table->unique(['skill_id', 'service_id'], 'efm_map_skills_to_services_skill_id_service_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_skills_to_services');
    }
};
