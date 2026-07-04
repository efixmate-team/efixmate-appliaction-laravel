<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_address', function (Blueprint $table) {
            $table->increments('address_id');
            $table->unsignedInteger('customer_id');
            $table->string('address', 100)->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->unsignedInteger('pincode');
            $table->string('latitude', 50);
            $table->string('longitude', 50);
            $table->unsignedInteger('area_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_selected')->default(false);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_address');
    }
};
