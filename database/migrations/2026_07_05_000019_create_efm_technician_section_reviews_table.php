<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_section_reviews', function (Blueprint $table) {
            $table->increments('review_id');
            $table->unsignedInteger('technician_id');
            $table->string('section', 60);
            $table->string('status', 20)->default("pending");
            $table->text('remark')->nullable();
            $table->string('reviewed_by', 50)->nullable();
            $table->dateTime('reviewed_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id'], 'idx_tech_section_reviews_tech');
            $table->unique(['technician_id', 'section'], 'uq_tech_section');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_section_reviews');
    }
};
