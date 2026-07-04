<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_user_policy_acceptance_logs', function (Blueprint $table) {
            $table->id('acceptance_id');
            $table->unsignedInteger('customer_id');
            $table->string('policy_type', 80);
            $table->unsignedBigInteger('policy_version_id')->nullable();
            $table->string('version_label', 40);
            $table->dateTime('accepted_at', 6)->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('source', 40)->default("web");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'policy_type', 'accepted_at'], 'efm_user_policy_acceptance_customer_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_user_policy_acceptance_logs');
    }
};
