<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_chat_messages', function (Blueprint $table) {
            $table->id('message_id');
            $table->unsignedInteger('booking_id');
            $table->string('sender_type', 20);
            $table->unsignedInteger('customer_id')->nullable();
            $table->unsignedInteger('technician_id')->nullable();
            $table->string('message_type', 20)->default("text");
            $table->text('content')->nullable();
            $table->string('media_url', 500)->nullable();
            $table->boolean('is_read')->default(false);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'created_at'], 'efm_booking_chat_messages_booking_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_chat_messages');
    }
};
