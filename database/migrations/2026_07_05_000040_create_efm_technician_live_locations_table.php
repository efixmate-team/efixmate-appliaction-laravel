<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_live_locations', function (Blueprint $table) {
            $table->increments('technician_id');
            $table->decimal('lat', 9, 6);
            $table->decimal('lng', 9, 6);
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['updated_at'], 'efm_technician_live_locations_updated_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_live_locations');
    }
};
