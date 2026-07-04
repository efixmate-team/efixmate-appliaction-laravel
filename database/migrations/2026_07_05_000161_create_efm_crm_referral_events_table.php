<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_referral_events', function (Blueprint $table) {
            $table->id('referral_id');
            $table->unsignedInteger('referrer_customer_id');
            $table->unsignedInteger('referred_customer_id')->nullable();
            $table->unsignedBigInteger('invite_id')->nullable();
            $table->string('event_type', 40);
            $table->unsignedInteger('reward_points')->default(0);
            $table->string('status', 30)->default("pending");
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['referrer_customer_id', 'created_at'], 'efm_crm_referral_events_referrer_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_referral_events');
    }
};
