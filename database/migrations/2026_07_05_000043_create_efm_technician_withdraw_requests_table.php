<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_withdraw_requests', function (Blueprint $table) {
            $table->id('request_id');
            $table->unsignedInteger('technician_id');
            $table->decimal('amount', 12, 2);
            $table->string('status', 20)->default("pending");
            $table->text('remark')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id', 'status'], 'efm_technician_withdraw_requests_technician_id_status_index');
            $table->index(['fy_id', 'technician_id'], 'efm_technician_withdraw_requests_fy_id_technician_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_withdraw_requests');
    }
};
