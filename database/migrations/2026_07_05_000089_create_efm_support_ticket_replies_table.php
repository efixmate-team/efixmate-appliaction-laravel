<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_support_ticket_replies', function (Blueprint $table) {
            $table->id('reply_id');
            $table->unsignedBigInteger('ticket_id');
            $table->string('sender_type', 20);
            $table->text('message');
            $table->json('attachment_urls')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->string('ticket_source', 20)->default("CUSTOMER");
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_support_ticket_replies');
    }
};
