<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ticket_timeline', function (Blueprint $table) {
            $table->id('timeline_id');
            $table->unsignedBigInteger('ticket_id');
            $table->string('ticket_source', 20);
            $table->string('event_type', 60);
            $table->string('event_label', 200)->nullable();
            $table->string('actor_type', 20)->nullable();
            $table->unsignedInteger('actor_id')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['ticket_id', 'ticket_source', 'created_at'], 'efm_admin_ticket_timeline_23941ba9_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ticket_timeline');
    }
};
