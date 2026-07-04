<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Real @relation-derived foreign keys from the source Prisma schema (28 total).
 * Added in a single trailing migration so table-creation order never matters.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('efm_admin_sessions', function (Blueprint $table) {
            $table->foreign('admin_id')->references('admin_id')->on('efm_admins')->cascadeOnDelete();
        });

        Schema::table('efm_technician_documents', function (Blueprint $table) {
            $table->foreign('efm_techniciansTechnician_id')->references('technician_id')->on('efm_technicians');
        });

        Schema::table('efm_technician_location', function (Blueprint $table) {
            $table->foreign('efm_techniciansTechnician_id')->references('technician_id')->on('efm_technicians');
        });

        Schema::table('efm_mstr_cities', function (Blueprint $table) {
            $table->foreign('state_id')->references('state_id')->on('efm_mstr_states')->cascadeOnDelete();
        });

        Schema::table('efm_booking_commission_snapshot', function (Blueprint $table) {
            $table->foreign('booking_id')->references('booking_id')->on('efm_bookings')->cascadeOnDelete();
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->foreign('booking_id')->references('booking_id')->on('efm_bookings')->cascadeOnDelete();
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->foreign('settlement_batch_id')->references('batch_id')->on('efm_admin_settlement_batches')->nullOnDelete();
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->foreign('payout_id')->references('payout_id')->on('efm_payouts')->nullOnDelete();
        });

        Schema::table('efm_mstr_areas', function (Blueprint $table) {
            $table->foreign('area_type_id')->references('area_type_id')->on('efm_lkp_area_type')->nullOnDelete();
        });

        Schema::table('efm_technician_areas', function (Blueprint $table) {
            $table->foreign('technician_id')->references('technician_id')->on('efm_technicians')->cascadeOnDelete();
        });

        Schema::table('efm_technician_areas', function (Blueprint $table) {
            $table->foreign('area_id')->references('area_id')->on('efm_mstr_areas')->cascadeOnDelete();
        });

        Schema::table('efm_technician_live_locations', function (Blueprint $table) {
            $table->foreign('technician_id')->references('technician_id')->on('efm_technicians')->cascadeOnDelete();
        });

        Schema::table('efm_booking_price_breakdown', function (Blueprint $table) {
            $table->foreign('booking_id')->references('booking_id')->on('efm_bookings')->cascadeOnDelete();
        });

        Schema::table('efm_booking_price_breakdown', function (Blueprint $table) {
            $table->foreign('snapshot_id')->references('snapshot_id')->on('efm_booking_pricing_snapshot')->nullOnDelete();
        });

        Schema::table('efm_booking_price_breakdown_line', function (Blueprint $table) {
            $table->foreign('breakdown_id')->references('breakdown_id')->on('efm_booking_price_breakdown')->cascadeOnDelete();
        });

        Schema::table('efm_booking_price_breakdown_line', function (Blueprint $table) {
            $table->foreign('booking_id')->references('booking_id')->on('efm_bookings')->cascadeOnDelete();
        });

        Schema::table('efm_booking_pricing_snapshot', function (Blueprint $table) {
            $table->foreign('booking_id')->references('booking_id')->on('efm_bookings')->cascadeOnDelete();
        });

        Schema::table('efm_mstr_states', function (Blueprint $table) {
            $table->foreign('country_id')->references('country_id')->on('efm_mstr_countries')->cascadeOnDelete();
        });

        Schema::table('efm_customer_refresh_tokens', function (Blueprint $table) {
            $table->foreign('session_id')->references('session_id')->on('efm_customer_sessions')->nullOnDelete();
        });

        Schema::table('efm_support_ticket_replies', function (Blueprint $table) {
            $table->foreign('ticket_id')->references('ticket_id')->on('efm_support_tickets')->cascadeOnDelete();
        });

        Schema::table('efm_technician_refresh_tokens', function (Blueprint $table) {
            $table->foreign('session_id')->references('session_id')->on('efm_technician_sessions')->nullOnDelete();
        });

        Schema::table('efm_customer_booking_cart_line', function (Blueprint $table) {
            $table->foreign('cart_id')->references('cart_id')->on('efm_customer_booking_cart')->cascadeOnDelete();
        });

        Schema::table('efm_map_booking_tag', function (Blueprint $table) {
            $table->foreign('tag_id')->references('tag_id')->on('efm_admin_booking_tags')->cascadeOnDelete();
        });

        Schema::table('efm_admin_notification_campaigns', function (Blueprint $table) {
            $table->foreign('template_id')->references('template_id')->on('efm_admin_notification_templates')->nullOnDelete();
        });

        Schema::table('efm_admin_notification_delivery', function (Blueprint $table) {
            $table->foreign('campaign_id')->references('campaign_id')->on('efm_admin_notification_campaigns')->nullOnDelete();
        });

        Schema::table('efm_admin_notification_schedules', function (Blueprint $table) {
            $table->foreign('template_id')->references('template_id')->on('efm_admin_notification_templates')->nullOnDelete();
        });

        Schema::table('efm_ledger_entries', function (Blueprint $table) {
            $table->foreign('debit_account')->references('account_code')->on('efm_ledger_accounts');
        });

        Schema::table('efm_ledger_entries', function (Blueprint $table) {
            $table->foreign('credit_account')->references('account_code')->on('efm_ledger_accounts');
        });
    }

    public function down(): void
    {
        Schema::table('efm_admin_sessions', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
        });

        Schema::table('efm_technician_documents', function (Blueprint $table) {
            $table->dropForeign(['efm_techniciansTechnician_id']);
        });

        Schema::table('efm_technician_location', function (Blueprint $table) {
            $table->dropForeign(['efm_techniciansTechnician_id']);
        });

        Schema::table('efm_mstr_cities', function (Blueprint $table) {
            $table->dropForeign(['state_id']);
        });

        Schema::table('efm_booking_commission_snapshot', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->dropForeign(['settlement_batch_id']);
        });

        Schema::table('efm_booking_settlement_item', function (Blueprint $table) {
            $table->dropForeign(['payout_id']);
        });

        Schema::table('efm_mstr_areas', function (Blueprint $table) {
            $table->dropForeign(['area_type_id']);
        });

        Schema::table('efm_technician_areas', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
        });

        Schema::table('efm_technician_areas', function (Blueprint $table) {
            $table->dropForeign(['area_id']);
        });

        Schema::table('efm_technician_live_locations', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
        });

        Schema::table('efm_booking_price_breakdown', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        Schema::table('efm_booking_price_breakdown', function (Blueprint $table) {
            $table->dropForeign(['snapshot_id']);
        });

        Schema::table('efm_booking_price_breakdown_line', function (Blueprint $table) {
            $table->dropForeign(['breakdown_id']);
        });

        Schema::table('efm_booking_price_breakdown_line', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        Schema::table('efm_booking_pricing_snapshot', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        Schema::table('efm_mstr_states', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
        });

        Schema::table('efm_customer_refresh_tokens', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
        });

        Schema::table('efm_support_ticket_replies', function (Blueprint $table) {
            $table->dropForeign(['ticket_id']);
        });

        Schema::table('efm_technician_refresh_tokens', function (Blueprint $table) {
            $table->dropForeign(['session_id']);
        });

        Schema::table('efm_customer_booking_cart_line', function (Blueprint $table) {
            $table->dropForeign(['cart_id']);
        });

        Schema::table('efm_map_booking_tag', function (Blueprint $table) {
            $table->dropForeign(['tag_id']);
        });

        Schema::table('efm_admin_notification_campaigns', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
        });

        Schema::table('efm_admin_notification_delivery', function (Blueprint $table) {
            $table->dropForeign(['campaign_id']);
        });

        Schema::table('efm_admin_notification_schedules', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
        });

        Schema::table('efm_ledger_entries', function (Blueprint $table) {
            $table->dropForeign(['debit_account']);
        });

        Schema::table('efm_ledger_entries', function (Blueprint $table) {
            $table->dropForeign(['credit_account']);
        });
    }
};
