<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_idempotency_keys', function (Blueprint $table) {
            $table->uuid('idempotency_key')->primary();
            $table->string('route', 128);
            $table->unsignedInteger('response_status')->nullable();
            $table->json('response_body')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('expires_at', 6);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_idempotency_keys');
    }
};
