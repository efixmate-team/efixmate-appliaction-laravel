<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_suspensions', function (Blueprint $table) {
            $table->id('suspension_id');
            $table->unsignedInteger('technician_id');
            $table->text('reason');
            $table->unsignedInteger('suspended_by');
            $table->dateTime('suspended_at', 6)->useCurrent();
            $table->unsignedInteger('reinstated_by')->nullable();
            $table->dateTime('reinstated_at', 6)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id', 'is_active'], 'efm_technician_suspensions_technician_id_is_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_suspensions');
    }
};
