<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technicians', function (Blueprint $table) {
            $table->increments('technician_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('mobile_number', 15);
            $table->string('email', 100)->nullable();
            $table->string('profile_pitcher', 255)->nullable();
            $table->string('selfie_photo', 255)->nullable();
            $table->unsignedInteger('status_id')->nullable();
            $table->boolean('is_selfie_verified')->default(false);
            $table->boolean('is_active')->default(false);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('category_id')->nullable();
            $table->unsignedInteger('sub_category_id')->nullable();
            $table->unsignedInteger('current_jobs')->default(0);
            $table->unsignedInteger('max_jobs')->default(1);
            $table->string('application_status', 32)->nullable();
            $table->text('application_reject_reason')->nullable();
            $table->string('technician_unique_id', 20)->nullable();
            $table->boolean('is_online')->default(false);
            $table->string('fcm_token', 512)->nullable();
            $table->boolean('vacation_mode')->default(false);
            $table->dateTime('vacation_until', 6)->nullable();
            $table->decimal('service_radius_km', 6, 2)->default(10);
            $table->boolean('geo_fence_enabled')->default(false);
            $table->string('referral_code', 32)->nullable();
            $table->unsignedInteger('referred_by_technician_id')->nullable();
            $table->string('availability_status', 20)->default("AVAILABLE");
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('is_deleted')->default(false);
            $table->unique(['technician_unique_id'], 'efm_technicians_technician_unique_id_unique');
            $table->unique(['referral_code'], 'efm_technicians_referral_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technicians');
    }
};
