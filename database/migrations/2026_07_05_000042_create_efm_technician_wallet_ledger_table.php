<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_wallet_ledger', function (Blueprint $table) {
            $table->id('ledger_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('booking_id')->nullable();
            $table->string('entry_type', 20);
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->json('meta')->nullable();
            $table->unsignedInteger('country_id')->nullable();
            $table->unsignedInteger('state_id')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->unsignedInteger('area_id')->nullable();
            $table->unsignedInteger('fy_id')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['technician_id', 'created_at'], 'efm_technician_wallet_ledger_technician_id_created_at_index');
            $table->index(['fy_id', 'technician_id'], 'efm_technician_wallet_ledger_fy_id_technician_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_wallet_ledger');
    }
};
