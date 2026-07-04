<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_domain_outbox', function (Blueprint $table) {
            $table->id('outbox_id');
            $table->string('event_type', 64);
            $table->string('aggregate_type', 32)->default("booking");
            $table->string('aggregate_id', 64);
            $table->json('payload')->default("{}");
            $table->string('status', 16)->default("PENDING");
            $table->dateTime('published_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_domain_outbox');
    }
};
