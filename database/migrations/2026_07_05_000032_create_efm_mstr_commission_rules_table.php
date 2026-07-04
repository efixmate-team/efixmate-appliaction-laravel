<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_commission_rules', function (Blueprint $table) {
            $table->id('rule_id');
            $table->string('rule_name', 120);
            $table->string('rule_type', 32)->default("GLOBAL");
            $table->string('commission_mode', 20)->default("PERCENTAGE");
            $table->decimal('commission_value', 12, 4)->default(0);
            $table->decimal('min_commission', 12, 2)->nullable();
            $table->decimal('max_commission', 12, 2)->nullable();
            $table->unsignedInteger('service_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('technician_id')->nullable();
            $table->string('campaign_code', 64)->nullable();
            $table->boolean('applies_to_surge')->default(false);
            $table->decimal('surge_rate_addon', 12, 4)->nullable();
            $table->json('formula')->nullable();
            $table->string('stack_group', 32)->default("BASE");
            $table->unsignedInteger('priority')->default(100);
            $table->dateTime('valid_from', 6)->nullable();
            $table->dateTime('valid_until', 6)->nullable();
            $table->boolean('gst_applicable')->default(true);
            $table->decimal('gst_rate', 5, 2)->default(18);
            $table->boolean('tds_applicable')->default(true);
            $table->string('tds_section', 20)->default("194C");
            $table->decimal('tds_rate', 5, 2)->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12)->default("system")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['is_active', 'rule_type', 'priority'], 'efm_mstr_commission_rules_is_active_rule_type_priority_index');
            $table->index(['service_id', 'area_id'], 'efm_mstr_commission_rules_service_id_area_id_index');
            $table->index(['technician_id'], 'efm_mstr_commission_rules_technician_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_commission_rules');
    }
};
