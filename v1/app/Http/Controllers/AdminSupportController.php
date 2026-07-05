<?php

namespace App\Http\Controllers;

use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\AdminSupportAssignment;
use Efixmate\Domain\Models\AdminTicketCategory;
use Efixmate\Domain\Models\AdminTicketEscalation;
use Efixmate\Domain\Models\AdminTicketInternalNote;
use Efixmate\Domain\Models\AdminTicketSlaPolicy;
use Efixmate\Domain\Models\SupportTicket;
use Efixmate\Domain\Models\SupportTicketReply;
use Illuminate\Http\Request;

/** Direct port of the support cluster in server/.../admin/support.routes.js (16 endpoints). */
class AdminSupportController extends Controller
{
    /** GET /api/admin/support/tickets */
    public function tickets(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = SupportTicket::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        if ($request->filled('priority')) $query->where('priority', $request->query('priority'));
        if ($request->filled('assigned_admin_id')) $query->where('assigned_admin_id', $request->query('assigned_admin_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('ticket_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/support/tickets/{id} */
    public function showTicket(int $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $replies = SupportTicketReply::where('ticket_id', $id)->orderBy('created_at')->get();
        $notes = AdminTicketInternalNote::where('ticket_id', $id)->orderByDesc('created_at')->get();
        $escalations = AdminTicketEscalation::where('ticket_id', $id)->orderByDesc('created_at')->get();

        return response()->json(['status' => true, 'data' => [
            'ticket' => $ticket, 'replies' => $replies, 'internal_notes' => $notes, 'escalations' => $escalations,
        ]]);
    }

    /** POST /api/admin/support/tickets/{id}/reply */
    public function reply(Request $request, int $id)
    {
        $data = $request->validate(['message' => ['required', 'string'], 'attachment_urls' => ['nullable', 'array']]);
        $ticket = SupportTicket::findOrFail($id);
        $reply = SupportTicketReply::create([
            'ticket_id' => $id, 'sender_type' => 'admin', 'message' => $data['message'],
            'attachment_urls' => array_map(fn ($u) => PublicUrlResolver::resolve($request, $u), $data['attachment_urls'] ?? []),
            'created_at' => now(),
        ]);
        if (! $ticket->first_response_at) {
            $ticket->update(['first_response_at' => now()]);
        }

        return response()->json(['status' => true, 'message' => 'Reply added', 'data' => $reply], 201);
    }

    /** POST /api/admin/support/tickets/{id}/assign */
    public function assign(Request $request, int $id)
    {
        $data = $request->validate(['admin_id' => ['required', 'integer']]);
        $ticket = SupportTicket::findOrFail($id);
        $ticket->update(['assigned_admin_id' => $data['admin_id'], 'updated_at' => now()]);
        $assignment = AdminSupportAssignment::create([
            'ticket_id' => $id, 'ticket_source' => 'support', 'admin_id' => $data['admin_id'],
            'priority' => $ticket->priority, 'status' => 'assigned', 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Ticket assigned', 'data' => $assignment], 201);
    }

    /** POST /api/admin/support/tickets/{id}/escalate */
    public function escalate(Request $request, int $id)
    {
        $data = $request->validate(['reason' => ['nullable', 'string']]);
        $ticket = SupportTicket::findOrFail($id);
        $fromLevel = $ticket->escalation_level ?? 0;
        $ticket->update(['escalation_level' => $fromLevel + 1, 'updated_at' => now()]);
        $escalation = AdminTicketEscalation::create([
            'ticket_id' => $id, 'ticket_source' => 'support', 'from_level' => $fromLevel, 'to_level' => $fromLevel + 1,
            'reason' => $data['reason'] ?? null, 'escalated_by' => $request->user()->admin_id, 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Ticket escalated', 'data' => $escalation], 201);
    }

    /** POST /api/admin/support/tickets/{id}/status */
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate(['status' => ['required', 'string', 'in:open,in_progress,resolved,closed']]);
        $ticket = SupportTicket::findOrFail($id);
        $extra = [];
        if ($data['status'] === 'resolved') $extra['resolved_at'] = now();
        if ($data['status'] === 'closed') $extra['closed_at'] = now();
        $ticket->update(array_merge(['status' => $data['status'], 'updated_at' => now()], $extra));

        return response()->json(['status' => true, 'message' => 'Status updated', 'data' => $ticket->fresh()]);
    }

    /** POST /api/admin/support/tickets/{id}/internal-note */
    public function addInternalNote(Request $request, int $id)
    {
        $data = $request->validate(['note' => ['required', 'string']]);
        $note = AdminTicketInternalNote::create([
            'ticket_id' => $id, 'ticket_source' => 'support', 'admin_id' => $request->user()->admin_id,
            'note' => $data['note'], 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Note added', 'data' => $note], 201);
    }

    // ── Categories ──
    /** GET /api/admin/support/categories */
    public function categories()
    {
        return response()->json(['status' => true, 'data' => AdminTicketCategory::where('is_active', true)->orderBy('sort_order')->get()]);
    }

    /** POST /api/admin/support/categories */
    public function storeCategory(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string'], 'slug' => ['required', 'string', 'unique:efm_admin_ticket_categories,slug']]);
        $category = AdminTicketCategory::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Category created', 'data' => $category], 201);
    }

    /** DELETE /api/admin/support/categories/{id} */
    public function destroyCategory(int $id)
    {
        AdminTicketCategory::where('category_id', $id)->update(['is_active' => false, 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Category deleted']);
    }

    // ── SLA policies ──
    /** GET /api/admin/support/sla-policies */
    public function slaPolicies()
    {
        return response()->json(['status' => true, 'data' => AdminTicketSlaPolicy::where('is_active', true)->get()]);
    }

    /** POST /api/admin/support/sla-policies */
    public function storeSlaPolicy(Request $request)
    {
        $data = $request->validate([
            'priority' => ['required', 'string'],
            'first_response_minutes' => ['required', 'integer'],
            'resolution_minutes' => ['required', 'integer'],
        ]);
        $policy = AdminTicketSlaPolicy::updateOrCreate(
            ['priority' => $data['priority']],
            array_merge($data, ['is_active' => true, 'updated_at' => now()]),
        );

        return response()->json(['status' => true, 'message' => 'SLA policy saved', 'data' => $policy]);
    }

    // ── Analytics ──
    /** GET /api/admin/support/analytics */
    public function analytics()
    {
        return response()->json(['status' => true, 'data' => [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::where('status', 'open')->count(),
            'resolved' => SupportTicket::where('status', 'resolved')->count(),
            'sla_breached' => SupportTicket::whereNotNull('sla_due_at')->where('sla_due_at', '<', now())
                ->whereNotIn('status', ['resolved', 'closed'])->count(),
            'by_priority' => SupportTicket::selectRaw('priority, COUNT(*) as total')->groupBy('priority')->pluck('total', 'priority'),
        ]]);
    }
}
