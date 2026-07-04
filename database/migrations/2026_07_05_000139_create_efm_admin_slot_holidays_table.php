<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_slot_holidays', function (Blueprint $table) {
            $table->increments('holiday_id');
            $table->unsignedInteger('area_id')->nullable();
            $table->date('holiday_date');
            $table->string('reason', 200)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['area_id', 'holiday_date'], 'efm_admin_slot_holidays_area_id_holiday_date_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_slot_holidays');
    }
};
