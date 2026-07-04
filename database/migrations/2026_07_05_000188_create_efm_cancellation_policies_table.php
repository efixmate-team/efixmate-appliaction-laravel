<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_cancellation_policies', function (Blueprint $table) {
            $table->increments('policy_id');
            $table->unsignedInteger('window_hours');
            $table->string('fee_type', 10)->default("FLAT");
            $table->decimal('fee_value', 10, 2);
            $table->string('description', 200)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_cancellation_policies');
    }
};
