<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('efm_tracker_marketing_spend', function (Blueprint $table) {
            $table->increments('spend_id');
            $table->date('period_month');
            $table->string('channel', 50)->default("total");
            $table->decimal('spend', 12, 2)->default(0);
            $table->string('created_by', 50)->default("SYSTEM")->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->unique(['period_month', 'channel'], 'efm_tracker_marketing_spend_period_month_channel_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('efm_tracker_marketing_spend');
    }
};
