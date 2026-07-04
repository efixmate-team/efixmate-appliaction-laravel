<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_menus', function (Blueprint $table) {
            $table->increments('menu_id');
            $table->string('menu_name', 50);
            $table->string('menu_path', 100);
            $table->string('menu_icon', 100);
            $table->unsignedInteger('menu_parent_id')->nullable();
            $table->unsignedInteger('menu_group_id');
            $table->string('menu_group', 100);
            $table->unsignedInteger('sort_order');
            $table->char('menu_type', 1)->default("I");
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_menus');
    }
};
