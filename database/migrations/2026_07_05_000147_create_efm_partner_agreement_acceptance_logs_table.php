<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_partner_agreement_acceptance_logs', function (Blueprint $table) {
            $table->id('acceptance_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedBigInteger('policy_version_id')->nullable();
            $table->string('version_label', 40);
            $table->dateTime('accepted_at', 6)->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('source', 40)->default("web");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id', 'accepted_at'], 'efm_partner_agreement_acceptance_tech_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_partner_agreement_acceptance_logs');
    }
};
