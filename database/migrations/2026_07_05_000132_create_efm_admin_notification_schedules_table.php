<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_notification_schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->string('title', 200);
            $table->string('channel', 20);
            $table->unsignedInteger('template_id')->nullable();
            $table->json('audience')->default("{}");
            $table->json('payload')->default("{}");
            $table->dateTime('scheduled_at', 6);
            $table->string('status', 30)->default("pending");
            $table->unsignedBigInteger('campaign_id')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->text('error_message')->nullable();
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['status', 'scheduled_at'], 'efm_admin_notification_schedules_status_scheduled_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_notification_schedules');
    }
};
