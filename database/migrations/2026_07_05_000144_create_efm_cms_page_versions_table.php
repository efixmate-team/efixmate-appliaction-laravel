<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cms_page_versions', function (Blueprint $table) {
            $table->id('version_id');
            $table->unsignedBigInteger('page_id')->nullable();
            $table->unsignedInteger('version_no');
            $table->string('title', 200);
            $table->string('slug', 120);
            $table->json('content')->default("{}");
            $table->string('status', 20)->default("draft");
            $table->string('created_by', 12)->default("system")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('published_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['page_id', 'version_no'], 'efm_cms_page_versions_page_id_version_no_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cms_page_versions');
    }
};
