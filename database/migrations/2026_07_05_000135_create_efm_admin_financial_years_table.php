<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_financial_years', function (Blueprint $table) {
            $table->increments('fy_id');
            $table->string('fy_label', 20);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['fy_label'], 'efm_admin_financial_years_fy_label_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_financial_years');
    }
};
