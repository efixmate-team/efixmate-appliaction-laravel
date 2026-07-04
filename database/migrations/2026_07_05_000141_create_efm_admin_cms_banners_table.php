<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_cms_banners', function (Blueprint $table) {
            $table->increments('banner_id');
            $table->string('title', 200);
            $table->string('image_url', 500)->nullable();
            $table->string('link_url', 500)->nullable();
            $table->string('redirect_url', 500)->nullable();
            $table->string('placement', 40)->default("home");
            $table->string('banner_type', 40)->default("homepage");
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('priority')->default(0);
            $table->dateTime('visible_from', 6)->nullable();
            $table->dateTime('visible_until', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('deleted_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['placement', 'is_active', 'priority', 'visible_from', 'visible_until'], 'efm_admin_cms_banners_bbc9789b_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_cms_banners');
    }
};
