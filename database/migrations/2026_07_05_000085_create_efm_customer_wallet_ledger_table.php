<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_wallet_ledger', function (Blueprint $table) {
            $table->id('ledger_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->string('entry_type', 30);
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->json('meta')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_customer_wallet_ledger_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_wallet_ledger');
    }
};
