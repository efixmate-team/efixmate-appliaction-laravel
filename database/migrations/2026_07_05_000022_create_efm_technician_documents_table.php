<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_technician_documents', function (Blueprint $table) {
            $table->increments('document_id');
            $table->unsignedInteger('technician_id');
            $table->unsignedInteger('document_type_id');
            $table->string('document_number', 50)->nullable();
            $table->string('attachement', 100)->nullable();
            $table->unsignedInteger('status_id');
            $table->boolean('is_verified')->default(false);
            $table->text('reject_remark')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('created_by', 12);
            $table->dateTime('created_at', 6);
            $table->string('updated_by', 12)->nullable();
            $table->dateTime('updated_at', 6)->nullable();
            $table->unsignedInteger('efm_techniciansTechnician_id')->nullable();
            $table->boolean('is_deleted')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_technician_documents');
    }
};
