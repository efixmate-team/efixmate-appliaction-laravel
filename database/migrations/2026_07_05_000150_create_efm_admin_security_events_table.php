<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_security_events', function (Blueprint $table) {
            $table->id('event_id');
            $table->unsignedInteger('admin_id')->nullable();
            $table->string('event_type', 60);
            $table->string('severity', 20)->default("info");
            $table->text('description')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['event_type', 'created_at'], 'efm_admin_security_events_event_type_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_security_events');
    }
};
