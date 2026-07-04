<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_support_faqs', function (Blueprint $table) {
            $table->increments('faq_id');
            $table->string('category', 80)->nullable();
            $table->text('question');
            $table->text('answer');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('audience', 20)->default("CUSTOMER");
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_support_faqs');
    }
};
