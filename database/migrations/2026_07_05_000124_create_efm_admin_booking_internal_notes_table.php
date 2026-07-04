<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_booking_internal_notes', function (Blueprint $table) {
            $table->id('note_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('admin_id');
            $table->text('note');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'created_at'], 'efm_admin_booking_internal_notes_booking_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_booking_internal_notes');
    }
};
