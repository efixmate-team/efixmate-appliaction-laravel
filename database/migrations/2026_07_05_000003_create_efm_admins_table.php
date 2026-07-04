<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admins', function (Blueprint $table) {
            $table->increments('admin_id');
            $table->string('admin_uid', 255);
            $table->string('admin_code', 20)->nullable();
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('mobile_number', 15);
            $table->string('email', 50);
            $table->string('password', 100);
            $table->string('secret_key', 255);
            $table->char('admin_type', 1);
            $table->boolean('email_verified')->default(false);
            $table->boolean('mobile_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('totp_enabled')->default(false);
            $table->text('totp_secret_encrypted')->nullable();
            $table->unsignedInteger('failed_login_count')->default(0);
            $table->dateTime('locked_until', 6)->nullable();
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('role_id')->nullable();
            $table->boolean('role_active')->default(true);
            $table->text('profile_image')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['admin_code'], 'efm_admins_admin_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admins');
    }
};
