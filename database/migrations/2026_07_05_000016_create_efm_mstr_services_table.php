<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_services', function (Blueprint $table) {
            $table->increments('service_id');
            $table->unsignedInteger('order_seq');
            $table->unsignedInteger('category_id');
            $table->string('service', 100);
            $table->string('service_code', 20)->nullable();
            $table->text('description');
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->decimal('base_price', 10, 2)->default(0)->nullable();
            $table->string('duration', 50)->nullable();
            $table->string('base_duration', 50)->nullable();
            $table->string('image_url', 255)->default("");
            $table->string('video_url', 255)->nullable();
            $table->string('service_icon', 255)->nullable();
            $table->string('service_color', 20)->nullable();
            $table->string('slug', 120)->nullable();
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->json('booking_type_ids')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('unit_ids')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->json('charge_ids')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('is_emergency')->default(false);
            $table->boolean('is_quick_service')->default(false);
            $table->boolean('is_instant_service')->default(false);
            $table->boolean('is_one_click_service')->default(false);
            $table->boolean('is_deleted')->default(false);
            $table->unique(['service'], 'efm_mstr_services_service_unique');
            $table->unique(['service_code'], 'efm_mstr_services_service_code_unique');
            $table->index(['slug'], 'efm_mstr_services_slug_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_services');
    }
};
