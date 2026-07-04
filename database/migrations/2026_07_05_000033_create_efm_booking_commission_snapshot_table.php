<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_commission_snapshot', function (Blueprint $table) {
            $table->id('snapshot_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedBigInteger('breakdown_id')->nullable();
            $table->decimal('gross_basis', 14, 2);
            $table->json('matched_rules')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->decimal('base_commission_amount', 14, 2)->default(0);
            $table->decimal('surge_commission_amount', 14, 2)->default(0);
            $table->decimal('promo_adjustment', 14, 2)->default(0);
            $table->decimal('total_commission_amount', 14, 2)->default(0);
            $table->decimal('gst_on_commission', 14, 2)->default(0);
            $table->decimal('gst_rate', 5, 2)->default(18);
            $table->decimal('technician_gross_earning', 14, 2)->default(0);
            $table->decimal('tds_rate', 5, 2)->default(1);
            $table->decimal('tds_accrued', 14, 2)->default(0);
            $table->string('tds_section', 20)->default("194C");
            $table->decimal('technician_net_earning', 14, 2)->default(0);
            $table->decimal('platform_net_revenue', 14, 2)->default(0);
            $table->json('calculation_meta')->nullable();
            $table->string('engine_version', 32)->default("commission-v2");
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['booking_id'], 'efm_booking_commission_snapshot_booking_id_unique');
            $table->index(['created_at'], 'efm_booking_commission_snapshot_created_at_index');
            $table->index(['fy_id'], 'efm_booking_commission_snapshot_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_commission_snapshot');
    }
};
