<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_notification_inbox', function (Blueprint $table) {
            $table->id('inbox_id');
            $table->unsignedInteger('admin_id')->nullable();
            $table->string('title', 300);
            $table->text('body')->nullable();
            $table->string('channel', 20)->nullable();
            $table->string('category', 60)->default("system");
            $table->boolean('is_read')->default(false);
            $table->dateTime('read_at', 6)->nullable();
            $table->string('reference_type', 60)->nullable();
            $table->string('reference_id', 80)->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['admin_id', 'is_read', 'created_at'], 'efm_admin_notification_inbox_admin_id_is_read_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_notification_inbox');
    }
};
