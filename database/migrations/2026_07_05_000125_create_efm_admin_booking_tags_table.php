<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_booking_tags', function (Blueprint $table) {
            $table->increments('tag_id');
            $table->string('name', 80);
            $table->string('color', 20)->default("slate");
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['name'], 'efm_admin_booking_tags_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_booking_tags');
    }
};
