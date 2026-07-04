<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_activity_logs', function (Blueprint $table) {
            $table->increments('log_id');
            $table->string('actor_type', 20)->nullable();
            $table->unsignedInteger('actor_id')->nullable();
            $table->string('http_method', 10);
            $table->text('request_path');
            $table->unsignedInteger('status_code');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('summary', 500)->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['actor_type', 'actor_id', 'created_at'], 'efm_activity_logs_actor_type_actor_id_created_at_index');
            $table->index(['created_at'], 'efm_activity_logs_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_activity_logs');
    }
};
