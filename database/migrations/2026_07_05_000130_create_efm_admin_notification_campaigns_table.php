<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_notification_campaigns', function (Blueprint $table) {
            $table->id('campaign_id');
            $table->string('name', 120);
            $table->string('channel', 20);
            $table->unsignedInteger('template_id')->nullable();
            $table->json('audience')->default("{}");
            $table->text('message_body')->nullable();
            $table->string('status', 30)->default("draft");
            $table->boolean('is_broadcast')->default(false);
            $table->dateTime('scheduled_at', 6)->nullable();
            $table->dateTime('sent_at', 6)->nullable();
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_notification_campaigns');
    }
};
