<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_skills', function (Blueprint $table) {
            $table->increments('skill_id');
            $table->string('skill_name', 100);
            $table->unsignedInteger('category_id');
            $table->text('description')->default("");
            $table->string('skill_icon', 255)->nullable();
            $table->string('skill_color', 20)->nullable();
            $table->unsignedInteger('order_seq')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12)->default("system");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['skill_name'], 'efm_mstr_skills_skill_name_unique');
            $table->index(['category_id'], 'idx_skills_category');
            $table->index(['is_active'], 'idx_skills_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_skills');
    }
};
