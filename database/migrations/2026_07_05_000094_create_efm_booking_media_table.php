<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_media', function (Blueprint $table) {
            $table->id('media_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('customer_id');
            $table->string('media_type', 20);
            $table->string('url', 500);
            $table->string('uploader_type', 20)->default("CUSTOMER");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id'], 'efm_booking_media_booking_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_media');
    }
};
