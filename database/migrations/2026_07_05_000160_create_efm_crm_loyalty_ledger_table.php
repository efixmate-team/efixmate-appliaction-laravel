<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_loyalty_ledger', function (Blueprint $table) {
            $table->id('ledger_id');
            $table->unsignedInteger('customer_id');
            $table->unsignedInteger('points_delta');
            $table->unsignedInteger('balance_after');
            $table->string('entry_type', 40);
            $table->string('ref_type', 50)->nullable();
            $table->string('ref_id', 80)->nullable();
            $table->text('note')->nullable();
            $table->unsignedInteger('created_by')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_crm_loyalty_ledger_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_loyalty_ledger');
    }
};
