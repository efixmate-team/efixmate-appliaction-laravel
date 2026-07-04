<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_notifications', function (Blueprint $table) {
            $table->id('notification_id');
            $table->string('recipient_type', 20);
            $table->unsignedInteger('recipient_id');
            $table->string('title', 200);
            $table->text('body')->nullable();
            $table->string('type', 50)->nullable();
            $table->string('ref_type', 50)->nullable();
            $table->string('ref_id', 80)->nullable();
            $table->boolean('is_read')->default(false);
            $table->json('meta')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['recipient_type', 'recipient_id', 'is_read', 'created_at'], 'efm_notifications_a5b0dbdb_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_notifications');
    }
};
