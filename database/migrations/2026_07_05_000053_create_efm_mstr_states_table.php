<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_mstr_states', function (Blueprint $table) {
            $table->increments('state_id');
            $table->unsignedInteger('country_id')->nullable();
            $table->string('state_name', 100);
            $table->string('state_code', 10)->nullable();
            $table->boolean('is_active')->default(true)->nullable();
            $table->dateTime('created_at', 6)->useCurrent()->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['state_name'], 'efm_mstr_states_state_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_mstr_states');
    }
};
