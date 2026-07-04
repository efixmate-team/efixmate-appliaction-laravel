<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_complaints', function (Blueprint $table) {
            $table->id('complaint_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->unsignedBigInteger('ticket_id')->nullable();
            $table->string('category', 60)->default("general");
            $table->string('subject', 200);
            $table->text('description')->nullable();
            $table->string('status', 30)->default("open");
            $table->string('priority', 20)->default("normal");
            $table->unsignedInteger('assigned_to')->nullable();
            $table->text('resolution')->nullable();
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'status', 'created_at'], 'efm_crm_complaints_customer_id_status_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_complaints');
    }
};
