<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_ticket_categories', function (Blueprint $table) {
            $table->increments('category_id');
            $table->string('name', 120);
            $table->string('slug', 80);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['slug'], 'efm_admin_ticket_categories_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_ticket_categories');
    }
};
