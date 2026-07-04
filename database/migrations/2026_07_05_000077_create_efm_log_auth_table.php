<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_log_auth', function (Blueprint $table) {
            $table->increments('log_id');
            $table->string('user_type', 20);
            $table->unsignedInteger('user_id')->nullable();
            $table->string('action', 50);
            $table->string('ip_address', 45)->nullable();
            $table->json('device_info')->nullable();
            $table->string('status', 20);
            $table->text('remark')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['user_id', 'created_at'], 'efm_log_auth_user_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_log_auth');
    }
};
