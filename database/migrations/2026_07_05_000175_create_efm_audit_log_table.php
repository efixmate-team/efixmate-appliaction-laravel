<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_audit_log', function (Blueprint $table) {
            $table->id('audit_id');
            $table->string('entity_type', 64);
            $table->string('entity_id', 64);
            $table->string('action', 64);
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('performed_by_type', 32)->nullable();
            $table->string('performed_by_id', 64)->nullable();
            $table->string('ip', 45)->nullable();
            $table->json('meta')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_audit_log');
    }
};
