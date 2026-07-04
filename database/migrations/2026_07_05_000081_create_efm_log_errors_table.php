<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_log_errors', function (Blueprint $table) {
            $table->increments('log_id');
            $table->string('error_type', 100);
            $table->text('message');
            $table->text('stack_trace')->nullable();
            $table->string('api_endpoint', 255)->nullable();
            $table->json('payload')->nullable();
            $table->unsignedInteger('user_id')->nullable();
            $table->string('user_type', 20)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['error_type', 'created_at'], 'efm_log_errors_error_type_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_log_errors');
    }
};
