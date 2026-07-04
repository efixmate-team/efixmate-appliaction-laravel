<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_service_faqs', function (Blueprint $table) {
            $table->increments('faq_id');
            $table->unsignedInteger('service_id');
            $table->text('question');
            $table->text('answer');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['service_id', 'sort_order'], 'efm_service_faqs_service_id_sort_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_service_faqs');
    }
};
