<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_policy_versions', function (Blueprint $table) {
            $table->id('policy_version_id');
            $table->string('policy_type', 80);
            $table->string('page_slug', 120);
            $table->string('version_label', 40);
            $table->string('title', 200);
            $table->dateTime('effective_from', 6)->useCurrent();
            $table->dateTime('published_at', 6)->nullable();
            $table->boolean('is_published')->default(true);
            $table->json('content_snapshot')->default("{}");
            $table->string('created_by', 12)->default("system")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['policy_type', 'version_label'], 'efm_policy_versions_policy_type_version_label_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_policy_versions');
    }
};
