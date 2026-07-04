<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_registration_meta', function (Blueprint $table) {
            $table->increments('technician_id');
            $table->string('pan_number', 20)->nullable();
            $table->boolean('pan_verified')->default(false)->nullable();
            $table->string('aadhaar_number', 20)->nullable();
            $table->boolean('aadhaar_verified')->default(false)->nullable();
            $table->json('emergency_contact')->default("{}")->nullable();
            $table->unsignedInteger('experience_years')->nullable();
            $table->text('experience_details')->nullable();
            $table->json('languages')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->json('certificates')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->string('profile_video_url', 500)->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_registration_meta');
    }
};
