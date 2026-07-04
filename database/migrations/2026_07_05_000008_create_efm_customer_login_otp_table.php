<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_login_otp', function (Blueprint $table) {
            $table->increments('login_id');
            $table->unsignedInteger('customer_id')->nullable();
            $table->string('mobile_number', 15);
            $table->unsignedInteger('otp');
            $table->string('ip_address', 45);
            $table->boolean('is_registered')->default(false)->nullable();
            $table->dateTime('generated_at', 6)->useCurrent()->nullable();
            $table->dateTime('expired_at', 6);
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->string('created_by', 12);
            $table->unsignedInteger('attempts')->default(0);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_login_otp');
    }
};
