<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_support_tickets', function (Blueprint $table) {
            $table->id('ticket_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->string('ticket_number', 30)->nullable();
            $table->string('subject', 200);
            $table->text('description')->nullable();
            $table->string('status', 30)->default("open");
            $table->string('priority', 20)->default("normal")->nullable();
            $table->unsignedInteger('category_id')->nullable();
            $table->unsignedInteger('assigned_admin_id')->nullable();
            $table->dateTime('sla_due_at', 6)->nullable();
            $table->dateTime('first_response_at', 6)->nullable();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->dateTime('closed_at', 6)->nullable();
            $table->unsignedInteger('escalation_level')->default(0);
            $table->json('attachment_urls')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->string('requester_type', 20)->default("CUSTOMER");
            $table->boolean('is_deleted')->default(false);
            $table->unique(['ticket_number'], 'efm_support_tickets_ticket_number_unique');
            $table->index(['customer_id', 'created_at'], 'efm_support_tickets_customer_id_created_at_index');
            $table->index(['status', 'priority', 'updated_at'], 'efm_support_tickets_status_priority_updated_at_index');
            $table->index(['requester_type', 'status'], 'efm_support_tickets_requester_type_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_support_tickets');
    }
};
