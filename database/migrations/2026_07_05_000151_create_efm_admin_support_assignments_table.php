<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_support_assignments', function (Blueprint $table) {
            $table->id('assignment_id');
            $table->unsignedBigInteger('ticket_id');
            $table->string('ticket_source', 20)->default("customer");
            $table->unsignedInteger('admin_id');
            $table->string('priority', 20)->default("normal");
            $table->string('status', 30)->default("assigned");
            $table->text('note')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_support_assignments');
    }
};
