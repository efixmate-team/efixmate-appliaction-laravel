<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cms_sections', function (Blueprint $table) {
            $table->id('section_id');
            $table->unsignedBigInteger('page_id')->nullable();
            $table->string('section_key', 160);
            $table->string('label', 200);
            $table->string('section_type', 40)->default("json");
            $table->boolean('is_global')->default(false);
            $table->json('content')->default("{}");
            $table->json('draft_content')->default("{}");
            $table->string('status', 20)->default("published");
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12)->default("system")->nullable();
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->dateTime('published_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['section_key'], 'efm_cms_sections_section_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cms_sections');
    }
};
