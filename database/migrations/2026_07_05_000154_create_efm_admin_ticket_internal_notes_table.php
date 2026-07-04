<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ticket_internal_notes', function (Blueprint $table) {
            $table->id('note_id');
            $table->unsignedBigInteger('ticket_id');
            $table->string('ticket_source', 20);
            $table->unsignedInteger('admin_id');
            $table->text('note');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['ticket_id', 'ticket_source', 'created_at'], 'efm_admin_ticket_internal_notes_23941ba9_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ticket_internal_notes');
    }
};
