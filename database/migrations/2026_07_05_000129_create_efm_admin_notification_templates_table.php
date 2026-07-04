<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_notification_templates', function (Blueprint $table) {
            $table->increments('template_id');
            $table->string('channel', 20);
            $table->string('template_key', 80);
            $table->string('title', 200)->nullable();
            $table->text('body');
            $table->json('variables')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['template_key'], 'efm_admin_notification_templates_template_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_notification_templates');
    }
};
