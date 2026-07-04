<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_failed_logins', function (Blueprint $table) {
            $table->id('attempt_id');
            $table->unsignedInteger('admin_id')->nullable();
            $table->string('email', 100)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('reason', 80);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['created_at'], 'efm_admin_failed_logins_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_failed_logins');
    }
};
