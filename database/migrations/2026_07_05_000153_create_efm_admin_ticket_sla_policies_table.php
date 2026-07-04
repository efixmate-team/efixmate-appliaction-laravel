<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ticket_sla_policies', function (Blueprint $table) {
            $table->increments('policy_id');
            $table->string('priority', 20);
            $table->unsignedInteger('first_response_minutes');
            $table->unsignedInteger('resolution_minutes');
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['priority'], 'efm_admin_ticket_sla_policies_priority_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ticket_sla_policies');
    }
};
