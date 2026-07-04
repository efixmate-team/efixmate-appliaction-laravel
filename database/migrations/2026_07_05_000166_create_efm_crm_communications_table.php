<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_crm_communications', function (Blueprint $table) {
            $table->id('comm_id');
            $table->unsignedInteger('customer_id');
            $table->string('channel', 30);
            $table->string('direction', 10)->default("outbound");
            $table->string('subject', 200)->nullable();
            $table->text('body')->nullable();
            $table->string('status', 30)->default("sent");
            $table->string('ref_type', 50)->nullable();
            $table->string('ref_id', 80)->nullable();
            $table->unsignedInteger('admin_id')->nullable();
            $table->json('meta')->default("{}")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->boolean('is_deleted')->default(false);
            $table->index(['customer_id', 'created_at'], 'efm_crm_communications_customer_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_crm_communications');
    }
};
