<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_finance_report_runs', function (Blueprint $table) {
            $table->id('run_id');
            $table->string('report_type', 40);
            $table->string('format', 10)->default("json");
            $table->dateTime('date_from', 6)->nullable();
            $table->dateTime('date_to', 6)->nullable();
            $table->unsignedInteger('row_count')->default(0)->nullable();
            $table->json('filters')->default("{}")->nullable();
            $table->unsignedInteger('generated_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['report_type', 'created_at'], 'efm_admin_finance_report_runs_report_type_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_finance_report_runs');
    }
};
