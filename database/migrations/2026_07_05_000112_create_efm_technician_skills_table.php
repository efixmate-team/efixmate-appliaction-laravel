<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_skills', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('skill_id');
            $table->string('skill_level', 30)->default("standard");
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id'], 'idx_tech_skills_tech');
            $table->unique(['technician_id', 'skill_id'], 'efm_technician_skills_technician_id_skill_id_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_skills');
    }
};
