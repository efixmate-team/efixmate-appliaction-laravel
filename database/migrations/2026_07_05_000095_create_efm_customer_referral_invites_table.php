<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_customer_referral_invites', function (Blueprint $table) {
            $table->id('invite_id');
            $table->unsignedInteger('customer_id');
            $table->string('invitee_mobile', 15);
            $table->string('invitee_name', 100)->nullable();
            $table->string('status', 30)->default("sent");
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_customer_referral_invites_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_customer_referral_invites');
    }
};
