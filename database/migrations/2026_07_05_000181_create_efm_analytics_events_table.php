<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_analytics_events', function (Blueprint $table) {
            $table->id('event_id');
            $table->string('event_name', 64);
            $table->string('entity_type', 32)->nullable();
            $table->string('entity_id', 64)->nullable();
            $table->json('payload')->default("{}");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_analytics_events');
    }
};
