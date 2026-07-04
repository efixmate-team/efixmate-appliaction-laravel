<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_email_otp', function (Blueprint $table) {
            $table->id('otp_id');
            $table->unsignedInteger('customer_id');
            $table->string('email', 100);
            $table->string('otp', 10);
            $table->dateTime('expires_at', 6);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_email_otp');
    }
};
