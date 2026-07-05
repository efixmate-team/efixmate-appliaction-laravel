<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\CrmActivityEvent;
use Efixmate\Domain\Models\CrmBlockHistory;
use Efixmate\Domain\Models\CrmClvMetric;
use Efixmate\Domain\Models\CrmCommunication;
use Efixmate\Domain\Models\CrmComplaint;
use Efixmate\Domain\Models\CrmCustomerNote;
use Efixmate\Domain\Models\CrmLoyaltyBalance;
use Efixmate\Domain\Models\CrmLoyaltyLedger;
use Efixmate\Domain\Models\CrmReferralEvent;
use Efixmate\Domain\Models\CrmSpamSignal;
use Efixmate\Domain\Models\Customer;
use Illuminate\Http\Request;

/** Direct port of the CRM cluster in server/.../admin/crm.routes.js (24 endpoints). */
class AdminCrmController extends Controller
{
    /** GET /api/admin/crm/customers/{id}/360 */
    public function customer360(int $id)
    {
        $customer = Customer::findOrFail($id);
        $clv = CrmClvMetric::find($id);
        $loyalty = CrmLoyaltyBalance::find($id);
        $complaints = CrmComplaint::where('customer_id', $id)->count();
        $blocked = CrmBlockHistory::where('customer_id', $id)->orderByDesc('created_at')->first();

        return response()->json(['status' => true, 'data' => [
            'customer' => $customer, 'clv' => $clv, 'loyalty' => $loyalty,
            'complaint_count' => $complaints, 'last_block_event' => $blocked,
        ]]);
    }

    /** GET /api/admin/crm/customers/{id}/timeline */
    public function timeline(int $id)
    {
        $events = CrmActivityEvent::where('customer_id', $id)->orderByDesc('created_at')->limit(100)->get();

        return response()->json(['status' => true, 'data' => $events]);
    }

    /** GET /api/admin/crm/customers/{id}/clv */
    public function clv(int $id)
    {
        $clv = CrmClvMetric::find($id);
        if (! $clv) {
            $stats = Booking::where('customer_id', $id)
                ->selectRaw('COUNT(*) as total_bookings, SUM(CASE WHEN booking_status_id = 4 THEN 1 ELSE 0 END) as completed_bookings, SUM(CASE WHEN payment_status_id = 2 THEN COALESCE(final_price,0) ELSE 0 END) as total_paid')
                ->first();
            $clv = CrmClvMetric::create([
                'customer_id' => $id, 'lifetime_value' => $stats->total_paid ?? 0,
                'total_bookings' => $stats->total_bookings ?? 0, 'completed_bookings' => $stats->completed_bookings ?? 0,
                'total_paid' => $stats->total_paid ?? 0,
                'avg_order_value' => ($stats->total_bookings ?? 0) > 0 ? round(($stats->total_paid ?? 0) / $stats->total_bookings, 2) : 0,
                'computed_at' => now(),
            ]);
        }

        return response()->json(['status' => true, 'data' => $clv]);
    }

    // ── Notes ──
    /** GET /api/admin/crm/customers/{id}/notes */
    public function notes(int $id)
    {
        return response()->json(['status' => true, 'data' => CrmCustomerNote::where('customer_id', $id)->orderByDesc('is_pinned')->orderByDesc('created_at')->get()]);
    }

    /** POST /api/admin/crm/customers/{id}/notes */
    public function storeNote(Request $request, int $id)
    {
        $data = $request->validate(['note' => ['required', 'string'], 'is_pinned' => ['nullable', 'boolean']]);
        $note = CrmCustomerNote::create(array_merge($data, [
            'customer_id' => $id, 'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Note added', 'data' => $note], 201);
    }

    /** DELETE /api/admin/crm/notes/{id} */
    public function destroyNote(int $id)
    {
        CrmCustomerNote::where('note_id', $id)->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Note deleted']);
    }

    // ── Complaints ──
    /** GET /api/admin/crm/complaints */
    public function complaints(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = CrmComplaint::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        if ($request->filled('customer_id')) $query->where('customer_id', $request->query('customer_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('complaint_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** POST /api/admin/crm/complaints */
    public function storeComplaint(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer'],
            'booking_id' => ['nullable', 'integer'],
            'category' => ['nullable', 'string'],
            'subject' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'string'],
        ]);
        $complaint = CrmComplaint::create(array_merge($data, [
            'status' => 'open', 'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Complaint logged', 'data' => $complaint], 201);
    }

    /** POST /api/admin/crm/complaints/{id}/resolve */
    public function resolveComplaint(Request $request, int $id)
    {
        $data = $request->validate(['resolution' => ['required', 'string']]);
        $complaint = CrmComplaint::findOrFail($id);
        $complaint->update(['status' => 'resolved', 'resolution' => $data['resolution'], 'resolved_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Complaint resolved', 'data' => $complaint->fresh()]);
    }

    // ── Block / unblock (mirrors AdminCustomerController::verify, kept here for parity with Node's crm module) ──
    /** POST /api/admin/crm/customers/{id}/block */
    public function block(Request $request, int $id)
    {
        $data = $request->validate(['reason' => ['nullable', 'string']]);
        $customer = Customer::findOrFail($id);
        $customer->update(['is_blocked' => true, 'blocked_at' => now(), 'blocked_reason' => $data['reason'] ?? null, 'blocked_by' => (string) $request->user()->admin_id, 'updated_at' => now()]);
        $history = CrmBlockHistory::create(['customer_id' => $id, 'action' => 'blocked', 'reason' => $data['reason'] ?? null, 'admin_id' => $request->user()->admin_id, 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Customer blocked', 'data' => $history], 201);
    }

    /** POST /api/admin/crm/customers/{id}/unblock */
    public function unblock(Request $request, int $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update(['is_blocked' => false, 'blocked_at' => null, 'blocked_reason' => null, 'blocked_by' => null, 'updated_at' => now()]);
        $history = CrmBlockHistory::create(['customer_id' => $id, 'action' => 'unblocked', 'admin_id' => $request->user()->admin_id, 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Customer unblocked', 'data' => $history], 201);
    }

    // ── Communications ──
    /** GET /api/admin/crm/customers/{id}/communications */
    public function communications(int $id)
    {
        return response()->json(['status' => true, 'data' => CrmCommunication::where('customer_id', $id)->orderByDesc('created_at')->get()]);
    }

    /** POST /api/admin/crm/customers/{id}/communications */
    public function storeCommunication(Request $request, int $id)
    {
        $data = $request->validate(['channel' => ['required', 'string'], 'subject' => ['nullable', 'string'], 'body' => ['required', 'string']]);
        $comm = CrmCommunication::create(array_merge($data, [
            'customer_id' => $id, 'direction' => 'outbound', 'status' => 'sent', 'admin_id' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Communication logged', 'data' => $comm], 201);
    }

    // ── Loyalty ──
    /** GET /api/admin/crm/customers/{id}/loyalty */
    public function loyalty(int $id)
    {
        $balance = CrmLoyaltyBalance::find($id);
        $ledger = CrmLoyaltyLedger::where('customer_id', $id)->orderByDesc('ledger_id')->limit(50)->get();

        return response()->json(['status' => true, 'data' => ['balance' => $balance, 'ledger' => $ledger]]);
    }

    /** POST /api/admin/crm/customers/{id}/loyalty/credit */
    public function creditLoyalty(Request $request, int $id)
    {
        $data = $request->validate(['points' => ['required', 'integer'], 'note' => ['nullable', 'string']]);
        $balance = CrmLoyaltyBalance::firstOrCreate(['customer_id' => $id], ['points_balance' => 0, 'tier' => 'BRONZE']);
        $newBalance = $balance->points_balance + $data['points'];
        $balance->update(['points_balance' => $newBalance, 'updated_at' => now()]);
        $entry = CrmLoyaltyLedger::create([
            'customer_id' => $id, 'points_delta' => $data['points'], 'balance_after' => $newBalance,
            'entry_type' => $data['points'] >= 0 ? 'CREDIT' : 'DEBIT', 'note' => $data['note'] ?? null,
            'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Loyalty points adjusted', 'data' => $entry], 201);
    }

    // ── Referral events ──
    /** GET /api/admin/crm/customers/{id}/referral-events */
    public function referralEvents(int $id)
    {
        $rows = CrmReferralEvent::where('referrer_customer_id', $id)->orWhere('referred_customer_id', $id)
            ->orderByDesc('created_at')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    // ── Spam signals ──
    /** GET /api/admin/crm/customers/{id}/spam-signals */
    public function spamSignals(int $id)
    {
        return response()->json(['status' => true, 'data' => CrmSpamSignal::where('customer_id', $id)->orderByDesc('created_at')->get()]);
    }

    /** POST /api/admin/crm/customers/{id}/spam-scan */
    public function spamScan(int $id)
    {
        $customer = Customer::findOrFail($id);
        $score = (int) $customer->spam_score;
        $signals = CrmSpamSignal::where('customer_id', $id)->orderByDesc('created_at')->limit(20)->get();

        return response()->json(['status' => true, 'data' => ['spam_score' => $score, 'flagged' => (bool) $customer->spam_flag, 'recent_signals' => $signals]]);
    }
}
