<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Node's ensureBookingCartSchema() ALTERs these onto efm_customer_booking_cart
 * lazily; ported as a real migration instead. Written by persistQuoteOnCart()
 * (fire-and-forget bookkeeping cache of the last quote) — non-critical.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('efm_customer_booking_cart', function (Blueprint $table) {
            $table->uuid('quote_id')->nullable()->after('instructions');
            $table->string('quote_hash', 64)->nullable()->after('quote_id');
            $table->dateTime('quoted_at', 6)->nullable()->after('quote_hash');
            $table->string('pricing_engine_version', 32)->nullable()->after('quoted_at');
        });
    }

    public function down(): void
    {
        Schema::table('efm_customer_booking_cart', function (Blueprint $table) {
            $table->dropColumn(['quote_id', 'quote_hash', 'quoted_at', 'pricing_engine_version']);
        });
    }
};
