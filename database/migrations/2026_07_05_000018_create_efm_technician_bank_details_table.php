<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_bank_details', function (Blueprint $table) {
            $table->increments('details_id');
            $table->unsignedInteger('technician_id');
            $table->string('acount_holder_name', 100);
            $table->string('account_number', 15);
            $table->string('ifsc_number', 15);
            $table->char('account_type', 1)->default("C");
            $table->unsignedInteger('status_id');
            $table->boolean('is_verified')->default(false);
            $table->text('reject_remark')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_bank_details');
    }
};
