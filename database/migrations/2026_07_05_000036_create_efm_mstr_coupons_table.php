<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_coupons', function (Blueprint $table) {
            $table->increments('coupon_id');
            $table->string('coupon_code', 50);
            $table->string('discount_type', 20)->default("PERCENTAGE")->nullable();
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->decimal('max_discount_amount', 10, 2)->nullable();
            $table->dateTime('valid_from', 6)->nullable();
            $table->dateTime('valid_until', 6)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('buy_x')->default(0)->nullable();
            $table->string('coupon_type', 20)->default("fixed")->nullable();
            $table->unsignedInteger('get_y')->default(0)->nullable();
            $table->unsignedInteger('usage_limit')->default(1)->nullable();
            $table->string('usage_type', 20)->default("single")->nullable();
            $table->unsignedInteger('max_uses')->default(0)->nullable();
            $table->unsignedInteger('max_uses_per_user')->default(1)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['coupon_code'], 'efm_mstr_coupons_coupon_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_coupons');
    }
};
