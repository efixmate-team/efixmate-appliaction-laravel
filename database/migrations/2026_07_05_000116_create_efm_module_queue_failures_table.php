<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_module_queue_failures', function (Blueprint $table) {
            $table->id('failure_id');
            $table->string('module', 40);
            $table->string('queue_name', 120);
            $table->string('job_name', 120);
            $table->json('payload')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->unsignedInteger('replay_count')->default(0)->nullable();
            $table->dateTime('dead_letter_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_module_queue_failures');
    }
};
