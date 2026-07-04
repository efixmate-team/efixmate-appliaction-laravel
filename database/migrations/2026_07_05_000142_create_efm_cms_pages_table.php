<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cms_pages', function (Blueprint $table) {
            $table->id('page_id');
            $table->string('title', 200);
            $table->string('slug', 120);
            $table->text('content')->default("");
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->string('status', 20)->default("draft");
            $table->dateTime('published_at', 6)->nullable();
            $table->dateTime('deleted_at', 6)->nullable();
            $table->string('created_by', 12)->default("system")->nullable();
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->string('name', 200)->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('page_type', 40)->default("content");
            $table->json('draft_content')->default("{}");
            $table->json('published_content')->default("{}");
            $table->dateTime('last_updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['status', 'published_at'], 'efm_cms_pages_status_published_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cms_pages');
    }
};
