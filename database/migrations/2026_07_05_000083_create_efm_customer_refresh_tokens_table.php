<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_refresh_tokens', function (Blueprint $table) {
            $table->id('token_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedBigInteger('session_id')->nullable();
            $table->string('token_hash', 128);
            $table->dateTime('expires_at', 6);
            $table->boolean('is_revoked')->default(false);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->unique(['token_hash'], 'efm_customer_refresh_tokens_token_hash_unique');
            $table->index(['customer_id', 'is_revoked'], 'efm_customer_refresh_tokens_customer_id_is_revoked_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_refresh_tokens');
    }
};
