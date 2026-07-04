<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_location', function (Blueprint $table) {
            $table->increments('location_id');
            $table->unsignedInteger('technician_id');
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->string('address', 200);
            $table->unsignedInteger('pincode');
            $table->string('latitude', 50);
            $table->string('longitude', 50);
            $table->unsignedInteger('status_id');
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('efm_techniciansTechnician_id')->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_location');
    }
};
