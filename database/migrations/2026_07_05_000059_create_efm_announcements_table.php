<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_announcements', function (Blueprint $table) {
            $table->increments('text_announcement_id');
            $table->string('title', 255);
            $table->text('message')->nullable();
            $table->string('target_audience', 20)->default("USER")->nullable();
            $table->string('target_screen', 80)->nullable();
            $table->string('scope_type', 40)->default("GLOBAL")->nullable();
            $table->text('scope_ids')->nullable();
            $table->unsignedInteger('priority')->default(0)->nullable();
            $table->dateTime('start_at', 6)->nullable();
            $table->dateTime('end_at', 6)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->boolean('is_disabled')->default(false)->nullable();
            $table->boolean('is_scheduled')->default(false)->nullable();
            $table->string('timezone', 80)->default("Asia/Kolkata")->nullable();
            $table->string('created_by', 12)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_announcements');
    }
};
