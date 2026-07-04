<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_booking_tag', function (Blueprint $table) {
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('tag_id');
            $table->unsignedInteger('tagged_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->primary(['booking_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_booking_tag');
    }
};
