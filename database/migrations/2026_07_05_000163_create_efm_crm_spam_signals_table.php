<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_spam_signals', function (Blueprint $table) {
            $table->id('signal_id');
            $table->unsignedInteger('customer_id');
            $table->string('signal_type', 50);
            $table->unsignedInteger('score_delta')->default(0);
            $table->json('details')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_crm_spam_signals_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_spam_signals');
    }
};
