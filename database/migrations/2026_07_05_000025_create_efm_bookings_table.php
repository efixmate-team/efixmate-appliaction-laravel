<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_bookings', function (Blueprint $table) {
            $table->increments('booking_id');
            $table->string('booking_uid', 100);
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('address_id');
            $table->unsignedInteger('service_category_id');
            $table->unsignedInteger('service_id');
            $table->unsignedInteger('booking_type_id');
            $table->unsignedInteger('quantity');
            $table->decimal('base_price', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('inspection_fee', 10, 2)->nullable();
            $table->decimal('estimated_price', 10, 2)->nullable();
            $table->decimal('final_price', 10, 2)->nullable();
            $table->unsignedInteger('booking_status_id')->nullable();
            $table->unsignedInteger('payment_status_id')->nullable();
            $table->unsignedInteger('payment_mode_id')->nullable();
            $table->text('problem_description')->nullable();
            $table->dateTime('scheduled_date', 6)->nullable();
            $table->string('scheduled_time', 50)->nullable();
            $table->dateTime('assigned_at', 6)->nullable();
            $table->dateTime('started_at', 6)->nullable();
            $table->dateTime('completed_at', 6)->nullable();
            $table->dateTime('cancelled_at', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->unsignedInteger('slot_id')->nullable();
            $table->unsignedInteger('technician_id')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->string('lifecycle_state', 40)->default("CREATED")->nullable();
            $table->boolean('is_emergency')->default(false);
            $table->string('priority', 20)->default("normal");
            $table->dateTime('sla_due_at', 6)->nullable();
            $table->unsignedInteger('fraud_score')->default(0);
            $table->json('fraud_flags')->default(new \Illuminate\Database\Query\Expression("(JSON_ARRAY())"));
            $table->unsignedInteger('duplicate_of_booking_id')->nullable();
            $table->unsignedInteger('assigned_admin_id')->nullable();
            $table->dateTime('no_service_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['lifecycle_state', 'booking_status_id'], 'efm_bookings_lifecycle_state_booking_status_id_index');
            $table->index(['lifecycle_state', 'booking_status_id', 'is_emergency', 'priority', 'sla_due_at'], 'efm_bookings_a73e98b8_index');
            $table->index(['customer_id', 'service_id', 'scheduled_date'], 'efm_bookings_customer_id_service_id_scheduled_date_index');
            $table->index(['fy_id'], 'efm_bookings_fy_id_index');
            $table->index(['area_id', 'fy_id'], 'efm_bookings_area_id_fy_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_bookings');
    }
};
