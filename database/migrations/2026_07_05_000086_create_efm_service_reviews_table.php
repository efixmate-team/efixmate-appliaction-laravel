<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_service_reviews', function (Blueprint $table) {
            $table->id('review_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->unsignedInteger('rating');
            $table->text('comment')->nullable();
            $table->json('image_urls')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"))->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['service_id', 'created_at'], 'efm_service_reviews_service_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_service_reviews');
    }
};
