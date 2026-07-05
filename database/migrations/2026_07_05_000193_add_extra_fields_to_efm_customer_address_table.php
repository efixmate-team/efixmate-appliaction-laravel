<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The live Node app's raw SQL (user.controller.js updateAddress) reads/writes these
 * 5 columns on efm_customer_address even though the checked-in prisma/schema.prisma
 * predates them (schema drift between the Node repo's tracked schema file and its
 * actual runtime database) — added here for behavioral parity with the real app.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('efm_customer_address', function (Blueprint $table) {
            $table->string('address_type', 20)->default('home')->after('is_deleted');
            $table->string('house_no', 100)->nullable()->after('address_type');
            $table->string('landmark', 150)->nullable()->after('house_no');
            $table->string('contact_name', 100)->nullable()->after('landmark');
            $table->string('contact_phone', 20)->nullable()->after('contact_name');
        });
    }

    public function down(): void
    {
        Schema::table('efm_customer_address', function (Blueprint $table) {
            $table->dropColumn(['address_type', 'house_no', 'landmark', 'contact_name', 'contact_phone']);
        });
    }
};
