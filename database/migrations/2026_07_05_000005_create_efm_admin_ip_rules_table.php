<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ip_rules', function (Blueprint $table) {
            $table->increments('rule_id');
            $table->string('scope', 20)->default("global");
            $table->unsignedInteger('admin_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('cidr', 50)->nullable();
            $table->string('label', 120)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['scope', 'is_active'], 'efm_admin_ip_rules_scope_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ip_rules');
    }
};
