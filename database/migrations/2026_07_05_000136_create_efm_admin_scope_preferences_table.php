<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_admin_scope_preferences', function (Blueprint $table) {
            $table->increments('pref_id');
            $table->unsignedInteger('admin_id');
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('updated_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['admin_id'], 'efm_admin_scope_preferences_admin_id_unique');
            $table->index(['admin_id'], 'efm_admin_scope_preferences_admin_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_admin_scope_preferences');
    }
};
