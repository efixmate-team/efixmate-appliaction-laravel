<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_service_category', function (Blueprint $table) {
            $table->increments('category_id');
            $table->unsignedInteger('order_seq');
            $table->string('category_name', 100);
            $table->string('category_code', 20)->nullable();
            $table->text('description');
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->string('category_icon', 100)->nullable();
            $table->string('category_route', 100)->nullable();
            $table->string('category_color', 20)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['category_name'], 'efm_mstr_service_category_category_name_unique');
            $table->unique(['category_code'], 'efm_mstr_service_category_category_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_service_category');
    }
};
