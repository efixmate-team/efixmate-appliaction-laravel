<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_roles', function (Blueprint $table) {
            $table->increments('role_id');
            $table->string('role_name', 100);
            $table->string('role_code', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['role_code'], 'efm_admin_roles_role_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_roles');
    }
};
