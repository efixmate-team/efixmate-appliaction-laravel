<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_customer_notes', function (Blueprint $table) {
            $table->id('note_id');
            $table->unsignedInteger('customer_id');
            $table->text('note');
            $table->boolean('is_pinned')->default(false);
            $table->unsignedInteger('created_by');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'is_pinned', 'created_at'], 'efm_crm_customer_notes_customer_id_is_pinned_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_customer_notes');
    }
};
