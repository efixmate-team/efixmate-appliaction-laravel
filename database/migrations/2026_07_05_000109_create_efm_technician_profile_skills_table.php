<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_profile_skills', function (Blueprint $table) {
            $table->id('id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('service_id');
            $table->string('skill_level', 30)->default("standard")->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['technician_id', 'service_id'], 'efm_technician_profile_skills_technician_id_service_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_profile_skills');
    }
};
