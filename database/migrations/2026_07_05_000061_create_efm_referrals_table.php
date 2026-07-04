<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_referrals', function (Blueprint $table) {
            $table->increments('referral_id');
            $table->unsignedInteger('referrer_id');
            $table->string('referrer_type', 20)->default("CUSTOMER");
            $table->unsignedInteger('referred_id');
            $table->string('referred_type', 20)->default("CUSTOMER");
            $table->string('referral_code', 32)->nullable();
            $table->string('status', 20)->default("PENDING");
            $table->string('trigger_event', 40)->default("FIRST_BOOKING_COMPLETED")->nullable();
            $table->decimal('referrer_reward', 10, 2)->default(0);
            $table->decimal('referred_reward', 10, 2)->default(0);
            $table->dateTime('rewarded_at', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->text('applied_ip')->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->text('flag_reason')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['referrer_id', 'referrer_type', 'status'], 'efm_referrals_referrer_id_referrer_type_status_index');
            $table->index(['referred_id', 'referred_type'], 'efm_referrals_referred_id_referred_type_index');
            $table->index(['referral_code'], 'efm_referrals_referral_code_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_referrals');
    }
};
