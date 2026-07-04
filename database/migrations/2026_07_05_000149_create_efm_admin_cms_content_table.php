<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_cms_content', function (Blueprint $table) {
            $table->increments('content_id');
            $table->string('content_key', 80);
            $table->string('content_type', 40);
            $table->string('title', 200)->nullable();
            $table->text('body')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['content_key'], 'efm_admin_cms_content_content_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_cms_content');
    }
};
