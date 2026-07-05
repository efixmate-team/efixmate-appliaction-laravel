<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateInvoiceJob;
use Efixmate\Domain\Models\AdminFinanceReportRun;
use Efixmate\Domain\Models\AdminFinanceTdsEntry;
use Efixmate\Domain\Models\AdminSettlementBatch;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingSettlementItem;
use Efixmate\Domain\Models\Invoice;
use Efixmate\Domain\Models\Payout;
use Efixmate\Domain\Models\Refund;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of the finance cluster in server/.../admin/finance.routes.js (17
 * endpoints). Settlement/refund-approval logic lives only here — /admin/finance/*,
 * /admin/settlements/*, and bare-ops aliases all route to these same methods
 * rather than the 3-way duplication the Node app has across finance/settlements/ops.
 */
class AdminFinanceController extends Controller
{
    /** GET /api/admin/finance/dashboard */
    public function dashboard()
    {
        $paidBookings = Booking::where('payment_status_id', 2);

        return response()->json(['status' => true, 'data' => [
            'total_revenue' => (float) (clone $paidBookings)->sum(DB::raw('COALESCE(final_price, estimated_price, 0)')),
            'total_refunds' => (float) Refund::sum('amount'),
            'pending_payouts' => Payout::where('status', 'pending')->sum('net_amount'),
            'total_invoices' => Invoice::count(),
        ]]);
    }

    /** GET /api/admin/finance/revenue */
    public function revenue(Request $request)
    {
        $days = min(365, (int) $request->query('days', 30));
        $rows = DB::table('efm_bookings')
            ->selectRaw('DATE(created_at) as day, SUM(COALESCE(final_price, estimated_price, 0)) as revenue, COUNT(*) as bookings')
            ->where('payment_status_id', 2)->where('created_at', '>=', now()->subDays($days))
            ->groupBy('day')->orderBy('day')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/finance/gst-summary */
    public function gstSummary(Request $request)
    {
        $query = Invoice::query();
        if ($request->filled('fy_id')) $query->where('fy_id', $request->query('fy_id'));

        return response()->json(['status' => true, 'data' => [
            'total_taxable' => (float) (clone $query)->sum('taxable_amount'),
            'total_gst' => (float) (clone $query)->sum('gst_amount'),
            'total_cgst' => (float) (clone $query)->sum('cgst_amount'),
            'total_sgst' => (float) (clone $query)->sum('sgst_amount'),
            'total_igst' => (float) (clone $query)->sum('igst_amount'),
            'invoice_count' => (clone $query)->count(),
        ]]);
    }

    /** GET /api/admin/finance/tds-entries */
    public function tdsEntries(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 25));
        $query = AdminFinanceTdsEntry::query();
        if ($request->filled('technician_id')) $query->where('technician_id', $request->query('technician_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('tds_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    // ── Settlements ──
    /** GET /api/admin/finance/settlements */
    public function settlements(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = AdminSettlementBatch::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('batch_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/finance/settlements/{id} */
    public function showSettlement(int $id)
    {
        $batch = AdminSettlementBatch::findOrFail($id);
        $items = BookingSettlementItem::where('settlement_batch_id', $id)->get();

        return response()->json(['status' => true, 'data' => ['batch' => $batch, 'items' => $items]]);
    }

    /** POST /api/admin/finance/settlements/process */
    public function processSettlement(Request $request)
    {
        $data = $request->validate(['period_start' => ['required', 'date'], 'period_end' => ['required', 'date']]);

        $items = BookingSettlementItem::whereNull('settlement_batch_id')
            ->whereBetween('created_at', [$data['period_start'], $data['period_end']])->get();

        $batch = DB::transaction(function () use ($data, $items, $request) {
            $batch = AdminSettlementBatch::create([
                'period_start' => $data['period_start'], 'period_end' => $data['period_end'], 'status' => 'processed',
                'total_amount' => $items->sum('amount'), 'technician_count' => $items->pluck('technician_id')->unique()->count(),
                'processed_by' => $request->user()->admin_id, 'processed_at' => now(), 'created_at' => now(),
            ]);
            BookingSettlementItem::whereIn('item_id', $items->pluck('item_id'))
                ->update(['settlement_batch_id' => $batch->batch_id, 'status' => 'settled', 'settled_at' => now()]);

            return $batch;
        });

        return response()->json(['status' => true, 'message' => 'Settlement processed', 'data' => $batch], 201);
    }

    // ── Payouts ──
    /** GET /api/admin/finance/payouts */
    public function payouts(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = Payout::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        if ($request->filled('technician_id')) $query->where('technician_id', $request->query('technician_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('payout_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** POST /api/admin/finance/payouts/{id}/mark-paid — bookkeeping-only, no live payout-gateway call. */
    public function markPayoutPaid(int $id)
    {
        $payout = Payout::findOrFail($id);
        $payout->update(['status' => 'paid', 'processed_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Payout marked paid', 'data' => $payout->fresh()]);
    }

    // ── Refunds ──
    /** GET /api/admin/finance/refunds */
    public function refunds(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $total = Refund::count();
        $data = Refund::orderByDesc('refund_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /**
     * POST /api/admin/finance/refunds/{id}/approve — step-up gated in routes/api.php
     * (sensitive money-movement action). Bookkeeping-only: marks the refund
     * approved, does not call a live gateway refund API (matches Stage 3's refund()).
     */
    public function approveRefund(int $id)
    {
        $refund = Refund::findOrFail($id);
        $refund->update(['refund_status_id' => 2]);

        return response()->json(['status' => true, 'message' => 'Refund approved', 'data' => $refund->fresh()]);
    }

    /** GET /api/admin/finance/failed-payments */
    public function failedPayments(Request $request)
    {
        $limit = min(100, (int) $request->query('limit', 25));
        $rows = Booking::where('payment_status_id', 3)->orderByDesc('booking_id')->limit($limit)->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    // ── Invoices ──
    /** GET /api/admin/finance/invoices */
    public function invoices(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = Invoice::query();
        if ($request->filled('customer_id')) $query->where('customer_id', $request->query('customer_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('invoice_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** POST /api/admin/finance/invoices/generate */
    public function generateInvoice(Request $request)
    {
        $data = $request->validate(['booking_id' => ['required', 'integer']]);
        abort_if(Invoice::where('booking_id', $data['booking_id'])->exists(), 409, 'Invoice already generated for this booking');

        GenerateInvoiceJob::dispatch(['booking_id' => $data['booking_id'], 'generated_by' => $request->user()->admin_id]);
        $invoice = Invoice::where('booking_id', $data['booking_id'])->first();

        return response()->json(['status' => true, 'message' => 'Invoice generated', 'data' => $invoice], 201);
    }

    // ── Reconciliation & reports ──
    /** GET /api/admin/finance/reconciliation */
    public function reconciliation()
    {
        return response()->json(['status' => true, 'data' => [
            'paid_bookings_without_invoice' => Booking::where('payment_status_id', 2)
                ->whereNotIn('booking_id', Invoice::pluck('booking_id'))->count(),
            'settled_items_pending_payout' => BookingSettlementItem::whereNotNull('settlement_batch_id')->whereNull('payout_id')->count(),
        ]]);
    }

    /** POST /api/admin/finance/reports/export */
    public function exportReport(Request $request)
    {
        $data = $request->validate([
            'report_type' => ['required', 'string'], 'format' => ['nullable', 'string', 'in:csv,json'],
            'date_from' => ['nullable', 'date'], 'date_to' => ['nullable', 'date'],
        ]);
        $run = AdminFinanceReportRun::create(array_merge($data, [
            'format' => $data['format'] ?? 'csv', 'row_count' => 0, 'generated_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Report run queued', 'data' => $run], 201);
    }

    /** GET /api/admin/finance/reports/runs */
    public function reportRuns()
    {
        return response()->json(['status' => true, 'data' => AdminFinanceReportRun::orderByDesc('run_id')->limit(50)->get()]);
    }
}
