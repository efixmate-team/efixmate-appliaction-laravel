<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_notification_prefs', function (Blueprint $table) {
            $table->string('user_type', 20);
            $table->unsignedInteger('user_id');
            $table->boolean('push_enabled')->default(true);
            $table->boolean('sms_enabled')->default(true);
            $table->boolean('email_enabled')->default(true);
            $table->boolean('booking_alerts')->default(true);
            $table->boolean('promo_alerts')->default(true);
            $table->boolean('job_alerts')->default(true);
            $table->boolean('earnings_alerts')->default(true);
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->primary(['user_type', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_notification_prefs');
    }
};
