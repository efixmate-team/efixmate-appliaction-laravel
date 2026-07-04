<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_booking_notes', function (Blueprint $table) {
            $table->id('note_id');
            $table->unsignedInteger('booking_id');
            $table->unsignedInteger('customer_id');
            $table->text('note');
            $table->string('author_type', 20)->default("CUSTOMER");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['booking_id', 'created_at'], 'efm_booking_notes_booking_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_booking_notes');
    }
};
