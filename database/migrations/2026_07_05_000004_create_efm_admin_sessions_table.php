<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_sessions', function (Blueprint $table) {
            $table->id('session_id');
            $table->unsignedInteger('admin_id');
            $table->string('device_id', 128)->nullable();
            $table->string('device_name', 120)->nullable();
            $table->string('platform', 40)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('token_jti', 64)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_seen_at', 6)->useCurrent();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('revoked_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['admin_id', 'is_active', 'last_seen_at'], 'efm_admin_sessions_admin_id_is_active_last_seen_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_sessions');
    }
};
