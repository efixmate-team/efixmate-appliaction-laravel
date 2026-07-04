<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_lkp_document_type', function (Blueprint $table) {
            $table->increments('document_type_id');
            $table->unsignedInteger('order_seq');
            $table->string('document_type', 100);
            $table->string('applies_to', 100)->nullable();
            $table->boolean('is_mandatory')->default(true);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_lkp_document_type');
    }
};
