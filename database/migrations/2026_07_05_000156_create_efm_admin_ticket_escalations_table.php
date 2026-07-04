<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ticket_escalations', function (Blueprint $table) {
            $table->id('escalation_id');
            $table->unsignedBigInteger('ticket_id');
            $table->string('ticket_source', 20);
            $table->unsignedInteger('from_level')->default(0);
            $table->unsignedInteger('to_level');
            $table->text('reason')->nullable();
            $table->unsignedInteger('escalated_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ticket_escalations');
    }
};
