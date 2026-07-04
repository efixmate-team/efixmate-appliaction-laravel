<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_activity_events', function (Blueprint $table) {
            $table->id('event_id');
            $table->unsignedInteger('customer_id');
            $table->string('event_type', 50);
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('ref_type', 50)->nullable();
            $table->string('ref_id', 80)->nullable();
            $table->string('actor_type', 20)->default("system");
            $table->unsignedInteger('actor_id')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_crm_activity_events_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_activity_events');
    }
};
