<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_map_admin_role_privilege', function (Blueprint $table) {
            $table->increments('map_id');
            $table->unsignedInteger('privilege_id');
            $table->unsignedInteger('role_id');
            $table->string('permission_type', 10)->default("ALLOW");
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['role_id', 'privilege_id', 'permission_type'], 'ux_admin_role_privilege_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_map_admin_role_privilege');
    }
};
