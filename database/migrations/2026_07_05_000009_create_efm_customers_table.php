<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customers', function (Blueprint $table) {
            $table->increments('customer_id');
            $table->string('customer_uid', 255);
            $table->string('customer_code', 20)->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('mobile_number', 15);
            $table->string('email', 100)->nullable();
            $table->boolean('email_verified')->default(false);
            $table->boolean('mobile_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('profile_pitcher', 255)->nullable();
            $table->boolean('is_blocked')->default(false);
            $table->dateTime('blocked_at', 6)->nullable();
            $table->text('blocked_reason')->nullable();
            $table->unsignedInteger('blocked_by')->nullable();
            $table->unsignedInteger('spam_score')->default(0);
            $table->boolean('spam_flag')->default(false);
            $table->string('referral_code', 32)->nullable();
            $table->unsignedInteger('referred_by_customer_id')->nullable();
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->dateTime('last_retention_nudge_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['customer_code'], 'efm_customers_customer_code_unique');
            $table->unique(['referral_code'], 'efm_customers_referral_code_unique');
            $table->index(['spam_flag', 'spam_score'], 'efm_customers_spam_flag_spam_score_index');
            $table->index(['is_blocked', 'blocked_at'], 'efm_customers_is_blocked_blocked_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customers');
    }
};
