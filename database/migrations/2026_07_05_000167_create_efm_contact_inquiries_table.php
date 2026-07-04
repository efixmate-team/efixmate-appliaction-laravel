<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_contact_inquiries', function (Blueprint $table) {
            $table->id('inquiry_id');
            $table->string('name', 120);
            $table->string('email', 200);
            $table->string('phone', 30)->nullable();
            $table->string('subject', 250)->nullable();
            $table->text('message');
            $table->string('status', 30)->default("new");
            $table->string('source', 50)->default("website");
            $table->text('admin_notes')->nullable();
            $table->dateTime('resolved_at', 6)->nullable();
            $table->unsignedInteger('resolved_by')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['status', 'created_at'], 'efm_contact_inquiries_status_created_at_index');
            $table->index(['email'], 'efm_contact_inquiries_email_index');
            $table->index(['created_at'], 'efm_contact_inquiries_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_contact_inquiries');
    }
};
