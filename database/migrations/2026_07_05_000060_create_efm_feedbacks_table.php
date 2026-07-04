<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_feedbacks', function (Blueprint $table) {
            $table->increments('feedback_id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('rating');
            $table->text('comment')->nullable();
            $table->string('status', 20)->default("PENDING")->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_feedbacks');
    }
};
