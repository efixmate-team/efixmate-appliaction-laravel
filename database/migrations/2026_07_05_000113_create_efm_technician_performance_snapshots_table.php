<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_performance_snapshots', function (Blueprint $table) {
            $table->increments('technician_id');
            $table->decimal('acceptance_ratio', 5, 2)->default(0)->nullable();
            $table->decimal('completion_ratio', 5, 2)->default(0)->nullable();
            $table->decimal('avg_rating', 3, 2)->default(0)->nullable();
            $table->unsignedInteger('complaints_count')->default(0)->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_performance_snapshots');
    }
};
