<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_privileges', function (Blueprint $table) {
            $table->increments('privilege_id');
            $table->unsignedInteger('menu_id');
            $table->string('privilege_name', 50);
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['menu_id', 'privilege_name'], 'unique_menu_privilege');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_privileges');
    }
};
