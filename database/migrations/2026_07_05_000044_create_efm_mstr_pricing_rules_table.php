<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_pricing_rules', function (Blueprint $table) {
            $table->increments('rule_id');
            $table->string('rule_name', 120);
            $table->unsignedInteger('service_id');
            $table->string('rule_type', 30)->default("SERVICE");
            $table->string('adjustment_mode', 20)->default("REPLACE");
            $table->decimal('adjustment_value', 12, 4)->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('discount_type', 20)->default("none")->nullable();
            $table->decimal('discount_value', 10, 2)->default(0)->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('slot_id')->nullable();
            $table->boolean('is_emergency')->nullable();
            $table->json('schedule_days')->nullable();
            $table->string('schedule_start_time', 10)->nullable();
            $table->string('schedule_end_time', 10)->nullable();
            $table->dateTime('start_date', 6)->nullable();
            $table->dateTime('end_date', 6)->nullable();
            $table->unsignedInteger('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['service_id', 'is_active', 'rule_type'], 'idx_pricing_rules_service_active');
            $table->index(['service_id', 'area_id'], 'idx_pricing_rules_service_area');
            $table->index(['service_id', 'city_id'], 'idx_pricing_rules_service_city');
            $table->index(['service_id', 'slot_id'], 'idx_pricing_rules_service_slot');
            $table->index(['service_id', 'start_date', 'end_date'], 'idx_pricing_rules_validity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_pricing_rules');
    }
};
