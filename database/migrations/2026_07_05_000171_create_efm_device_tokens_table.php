<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_device_tokens', function (Blueprint $table) {
            $table->id('token_id');
            $table->string('user_type', 20);
            $table->unsignedInteger('user_id');
            $table->string('fcm_token', 512);
            $table->string('device_id', 128)->nullable();
            $table->string('platform', 40)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['user_type', 'user_id', 'is_active'], 'efm_device_tokens_user_type_user_id_is_active_index');
            $table->unique(['user_type', 'user_id', 'fcm_token'], 'efm_device_tokens_user_type_user_id_fcm_token_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_device_tokens');
    }
};
