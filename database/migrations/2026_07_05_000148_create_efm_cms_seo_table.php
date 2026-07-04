<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cms_seo', function (Blueprint $table) {
            $table->id('seo_id');
            $table->string('entity_type', 20);
            $table->unsignedInteger('entity_id');
            $table->string('slug', 120);
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->dateTime('deleted_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['entity_type', 'entity_id'], 'efm_cms_seo_entity_type_entity_id_index');
            $table->index(['entity_type', 'slug'], 'efm_cms_seo_entity_type_slug_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cms_seo');
    }
};
