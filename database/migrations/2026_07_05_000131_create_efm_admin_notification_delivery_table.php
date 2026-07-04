<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_notification_delivery', function (Blueprint $table) {
            $table->id('delivery_id');
            $table->unsignedBigInteger('campaign_id')->nullable();
            $table->string('recipient_type', 20)->nullable();
            $table->unsignedInteger('recipient_id')->nullable();
            $table->string('channel', 20)->nullable();
            $table->string('status', 30)->default("queued");
            $table->string('subject', 500)->nullable();
            $table->string('recipient_address', 320)->nullable();
            $table->text('message_body')->nullable();
            $table->unsignedInteger('template_id')->nullable();
            $table->dateTime('scheduled_at', 6)->nullable();
            $table->dateTime('sent_at', 6)->nullable();
            $table->dateTime('failed_at', 6)->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->unsignedInteger('max_retries')->default(3);
            $table->text('error_message')->nullable();
            $table->string('provider', 50)->nullable();
            $table->string('provider_ref', 200)->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['channel', 'status', 'created_at'], 'efm_admin_notification_delivery_channel_status_created_at_index');
            $table->index(['campaign_id'], 'efm_admin_notification_delivery_campaign_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_notification_delivery');
    }
};
