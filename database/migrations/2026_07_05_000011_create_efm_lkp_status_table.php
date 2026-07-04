<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_lkp_status', function (Blueprint $table) {
            $table->increments('status_id');
            $table->unsignedInteger('order_seq');
            $table->unsignedInteger('status_type_id');
            $table->string('status', 100);
            $table->string('description', 255)->default("");
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_lkp_status');
    }
};
