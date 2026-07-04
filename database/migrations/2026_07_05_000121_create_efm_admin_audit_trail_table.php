<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_audit_trail', function (Blueprint $table) {
            $table->id('audit_id');
            $table->unsignedInteger('admin_id');
            $table->string('module', 60);
            $table->string('action', 80);
            $table->string('entity_type', 60)->nullable();
            $table->string('entity_id', 80)->nullable();
            $table->json('payload')->default("{}")->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['admin_id', 'created_at'], 'efm_admin_audit_trail_admin_id_created_at_index');
            $table->index(['entity_type', 'entity_id'], 'efm_admin_audit_trail_entity_type_entity_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_audit_trail');
    }
};
