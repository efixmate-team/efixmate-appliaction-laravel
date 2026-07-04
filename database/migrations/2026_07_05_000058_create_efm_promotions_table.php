<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_promotions', function (Blueprint $table) {
            $table->increments('announcement_id');
            $table->string('title', 200);
            $table->text('message');
            $table->string('trigger_type', 50)->nullable();
            $table->string('scope', 50)->default("GLOBAL")->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->string('subtitle', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('announcement_type', 40)->default("CAROUSEL")->nullable();
            $table->string('scope_type', 40)->default("GLOBAL")->nullable();
            $table->text('scope_ids')->nullable();
            $table->string('desktop_image_url', 500)->nullable();
            $table->string('mobile_image_url', 500)->nullable();
            $table->string('background_color', 20)->nullable();
            $table->string('cta_text', 120)->nullable();
            $table->string('cta_action_type', 50)->nullable();
            $table->text('cta_value')->nullable();
            $table->string('coupon_code', 80)->nullable();
            $table->string('discount_type', 30)->nullable();
            $table->decimal('discount_value', 10, 2)->nullable();
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->decimal('max_discount', 10, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->string('timezone', 80)->default("Asia/Kolkata")->nullable();
            $table->dateTime('start_at', 6)->nullable();
            $table->dateTime('end_at', 6)->nullable();
            $table->unsignedInteger('priority')->default(0)->nullable();
            $table->boolean('is_scheduled')->default(false)->nullable();
            $table->boolean('is_disabled')->default(false)->nullable();
            $table->string('target_audience', 20)->default("USER")->nullable();
            $table->string('target_screen', 80)->nullable();
            $table->string('created_by', 12)->nullable();
            $table->string('updated_by', 12)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_promotions');
    }
};
