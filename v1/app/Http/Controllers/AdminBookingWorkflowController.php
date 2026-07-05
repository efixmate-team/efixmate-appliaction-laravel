<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use App\Support\GeoAreaResolver;
use Efixmate\Domain\Models\AdminBookingDispute;
use Efixmate\Domain\Models\AdminBookingEscalation;
use Efixmate\Domain\Models\AdminBookingInternalNote;
use Efixmate\Domain\Models\AdminBookingTag;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingChatMessage;
use Efixmate\Domain\Models\BookingLifecycleHistory;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Models\DispatchJobOffer;
use Efixmate\Domain\Models\MapBookingTag;
use Efixmate\Domain\Models\TechnicianLiveLocation;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of the bookings-workflow cluster in
 * server/.../admin/bookingsWorkflow.routes.js (29 endpoints) — the admin
 * operational control center's core booking-management surface.
 */
class AdminBookingWorkflowController extends Controller
{
    /** GET /api/admin/bookings-workflow/dashboard */
    public function dashboard()
    {
        return response()->json(['status' => true, 'data' => [
            'total' => Booking::count(),
            'pending' => Booking::where('booking_status_id', BookingStatus::PENDING)->count(),
            'in_progress' => Booking::whereIn('booking_status_id', [BookingStatus::TECH_ACCEPTED, BookingStatus::ON_THE_WAY, BookingStatus::ARRIVED, BookingStatus::STARTED])->count(),
            'completed_today' => Booking::where('booking_status_id', BookingStatus::COMPLETED)->whereDate('completed_at', now()->toDateString())->count(),
            'cancelled_today' => Booking::where('booking_status_id', BookingStatus::CANCELLED)->whereDate('cancelled_at', now()->toDateString())->count(),
            'unassigned' => Booking::whereNull('technician_id')->where('booking_status_id', BookingStatus::PENDING)->count(),
            'disputed' => AdminBookingDispute::where('status', 'open')->count(),
        ]]);
    }

    /** POST /api/admin/bookings-workflow/list */
    public function list(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = min(100, (int) $request->input('limit', 20));
        $query = DB::table('efm_bookings as b')
            ->leftJoin('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
            ->leftJoin('efm_technicians as t', 't.technician_id', '=', 'b.technician_id')
            ->select('b.*', 'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 't.first_name as technician_first_name', 't.last_name as technician_last_name');

        if ($request->filled('status_in')) $query->whereIn('b.booking_status_id', (array) $request->input('status_in'));
        if ($request->filled('area_id')) $query->where('b.area_id', $request->input('area_id'));
        if ($request->filled('is_emergency')) $query->where('b.is_emergency', filter_var($request->input('is_emergency'), FILTER_VALIDATE_BOOLEAN));
        if ($request->filled('date_from')) $query->whereDate('b.scheduled_date', '>=', $request->input('date_from'));
        if ($request->filled('date_to')) $query->whereDate('b.scheduled_date', '<=', $request->input('date_to'));
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('b.booking_uid', 'like', "%{$search}%")
                    ->orWhere('c.first_name', 'like', "%{$search}%")->orWhere('c.mobile_number', 'like', "%{$search}%");
            });
        }

        $total = (clone $query)->count();
        $data = $query->orderByDesc('b.booking_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => ApiResponseFilter::filter($data->all(), 'booking_id'),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/bookings-workflow/live */
    public function live()
    {
        $rows = Booking::whereIn('booking_status_id', [
            BookingStatus::BROADCASTED, BookingStatus::TECH_ACCEPTED, BookingStatus::ON_THE_WAY, BookingStatus::ARRIVED, BookingStatus::STARTED,
        ])->orderByDesc('booking_id')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/bookings-workflow/disputes */
    public function disputes(Request $request)
    {
        $query = AdminBookingDispute::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('dispute_id')->get()]);
    }

    /** POST /api/admin/bookings-workflow/bulk-action */
    public function bulkAction(Request $request)
    {
        $data = $request->validate([
            'booking_ids' => ['required', 'array'], 'booking_ids.*' => ['integer'],
            'action' => ['required', 'string', 'in:cancel,tag,escalate'],
            'tag_id' => ['nullable', 'integer'], 'reason' => ['nullable', 'string'],
        ]);

        $affected = 0;
        foreach ($data['booking_ids'] as $bookingId) {
            switch ($data['action']) {
                case 'cancel':
                    Booking::where('booking_id', $bookingId)->update(['booking_status_id' => BookingStatus::CANCELLED, 'cancelled_at' => now(), 'updated_at' => now()]);
                    BookingStatusLog::create(['booking_id' => $bookingId, 'new_status' => BookingStatus::CANCELLED, 'changed_by' => (string) $request->user()->admin_id, 'remark' => $data['reason'] ?? 'Bulk cancel', 'created_at' => now()]);
                    break;
                case 'tag':
                    if (! empty($data['tag_id']) && ! MapBookingTag::where('booking_id', $bookingId)->where('tag_id', $data['tag_id'])->exists()) {
                        MapBookingTag::create(['booking_id' => $bookingId, 'tag_id' => $data['tag_id'], 'tagged_by' => $request->user()->admin_id, 'created_at' => now()]);
                    }
                    break;
                case 'escalate':
                    AdminBookingEscalation::create(['booking_id' => $bookingId, 'level' => 1, 'reason' => $data['reason'] ?? null, 'status' => 'open', 'escalated_by' => $request->user()->admin_id, 'created_at' => now()]);
                    break;
            }
            $affected++;
        }

        return response()->json(['status' => true, 'message' => 'Bulk action applied', 'affected' => $affected]);
    }

    // ── Per-booking cluster ──
    /** GET /api/admin/bookings-workflow/{id}/overview */
    public function overview(int $id)
    {
        $booking = Booking::findOrFail($id);
        $assignments = BookingTechnician::where('booking_id', $id)->get();

        return response()->json(['status' => true, 'data' => ['booking' => $booking, 'assignments' => $assignments]]);
    }

    /** GET /api/admin/bookings-workflow/{id}/detail */
    public function detail(int $id)
    {
        $booking = Booking::findOrFail($id);
        $logs = BookingStatusLog::where('booking_id', $id)->orderBy('created_at')->get();
        $notes = AdminBookingInternalNote::where('booking_id', $id)->orderByDesc('created_at')->get();
        $tags = DB::table('efm_map_booking_tag as m')->join('efm_admin_booking_tags as t', 't.tag_id', '=', 'm.tag_id')
            ->where('m.booking_id', $id)->select('t.tag_id', 't.name', 't.color')->get();

        return response()->json(['status' => true, 'data' => ['booking' => $booking, 'status_logs' => $logs, 'internal_notes' => $notes, 'tags' => $tags]]);
    }

    /** GET /api/admin/bookings-workflow/{id}/timeline */
    public function timeline(int $id)
    {
        $lifecycle = BookingLifecycleHistory::where('booking_id', $id)->orderBy('created_at')->get();
        $statusLogs = BookingStatusLog::where('booking_id', $id)->orderBy('created_at')->get();

        return response()->json(['status' => true, 'data' => ['lifecycle' => $lifecycle, 'status_logs' => $statusLogs]]);
    }

    /** GET /api/admin/bookings-workflow/{id}/chat */
    public function chat(int $id)
    {
        return response()->json(['status' => true, 'data' => BookingChatMessage::where('booking_id', $id)->orderBy('created_at')->get()]);
    }

    /** GET /api/admin/bookings-workflow/{id}/fraud */
    public function fraud(int $id)
    {
        $booking = Booking::findOrFail($id);

        return response()->json(['status' => true, 'data' => [
            'fraud_score' => $booking->fraud_score, 'fraud_flags' => $booking->fraud_flags ?? [],
        ]]);
    }

    /** GET /api/admin/bookings-workflow/{id}/duplicates */
    public function duplicates(int $id)
    {
        $booking = Booking::findOrFail($id);
        $dupes = Booking::where('booking_id', '!=', $id)->where('customer_id', $booking->customer_id)
            ->where('service_id', $booking->service_id)->whereDate('scheduled_date', $booking->scheduled_date)
            ->get();

        return response()->json(['status' => true, 'data' => $dupes]);
    }

    /** POST /api/admin/bookings-workflow/create */
    public function create(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer'], 'service_id' => ['required', 'integer'],
            'service_category_id' => ['required', 'integer'], 'address_id' => ['required', 'integer'],
            'area_id' => ['nullable', 'integer'], 'scheduled_date' => ['required', 'date'], 'scheduled_time' => ['nullable', 'string'],
            'base_price' => ['nullable', 'numeric'],
        ]);
        $booking = Booking::create(array_merge($data, [
            'booking_uid' => 'EFX'.now()->timestamp.strtoupper(\Illuminate\Support\Str::random(6)),
            'booking_type_id' => 1, 'quantity' => 1, 'booking_status_id' => BookingStatus::PENDING, 'payment_status_id' => 1,
            'created_by' => 'admin', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Booking created', 'data' => $booking], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/reassign */
    public function reassign(Request $request, int $id)
    {
        $data = $request->validate(['technician_id' => ['required', 'integer']]);
        $booking = Booking::findOrFail($id);
        BookingTechnician::where('booking_id', $id)->where('is_active', true)->update(['is_active' => false, 'updated_at' => now()]);
        $assignment = BookingTechnician::create([
            'technician_id' => $data['technician_id'], 'booking_id' => $id, 'assignment_role' => 'primary',
            'is_primary' => true, 'assigned_at' => now(), 'is_active' => true, 'created_by' => 'admin', 'created_at' => now(),
        ]);
        $booking->update(['technician_id' => $data['technician_id'], 'assigned_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Booking reassigned', 'data' => $assignment], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/force-complete */
    public function forceComplete(Request $request, int $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->update(['booking_status_id' => BookingStatus::COMPLETED, 'completed_at' => now(), 'updated_at' => now()]);
        BookingStatusLog::create(['booking_id' => $id, 'old_status' => $booking->getOriginal('booking_status_id'), 'new_status' => BookingStatus::COMPLETED, 'changed_by' => (string) $request->user()->admin_id, 'remark' => 'Force-completed by admin', 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Booking force-completed', 'data' => $booking->fresh()]);
    }

    /** POST /api/admin/bookings-workflow/{id}/escalate */
    public function escalate(Request $request, int $id)
    {
        $data = $request->validate(['reason' => ['nullable', 'string']]);
        $last = AdminBookingEscalation::where('booking_id', $id)->orderByDesc('level')->first();
        $escalation = AdminBookingEscalation::create([
            'booking_id' => $id, 'level' => ($last?->level ?? 0) + 1, 'reason' => $data['reason'] ?? null,
            'status' => 'open', 'escalated_by' => $request->user()->admin_id, 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Booking escalated', 'data' => $escalation], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/dispute */
    public function raiseDispute(Request $request, int $id)
    {
        $data = $request->validate(['dispute_type' => ['required', 'string'], 'description' => ['nullable', 'string']]);
        $booking = Booking::findOrFail($id);
        $dispute = AdminBookingDispute::create(array_merge($data, [
            'booking_id' => $id, 'customer_id' => $booking->customer_id, 'technician_id' => $booking->technician_id,
            'status' => 'open', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Dispute raised', 'data' => $dispute], 201);
    }

    /** POST /api/admin/bookings-workflow/disputes/{id}/resolve */
    public function resolveDispute(Request $request, int $id)
    {
        $data = $request->validate(['resolution' => ['required', 'string']]);
        $dispute = AdminBookingDispute::findOrFail($id);
        $dispute->update(['status' => 'resolved', 'resolution' => $data['resolution'], 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Dispute resolved', 'data' => $dispute->fresh()]);
    }

    /** POST /api/admin/bookings-workflow/{id}/state-override */
    public function stateOverride(Request $request, int $id)
    {
        $data = $request->validate(['booking_status_id' => ['required', 'integer'], 'reason' => ['nullable', 'string']]);
        $booking = Booking::findOrFail($id);
        $oldStatus = $booking->booking_status_id;
        $booking->update(['booking_status_id' => $data['booking_status_id'], 'updated_at' => now()]);
        BookingLifecycleHistory::create(['booking_id' => $id, 'from_state' => (string) $oldStatus, 'to_state' => (string) $data['booking_status_id'], 'changed_by' => (string) $request->user()->admin_id, 'user_type' => 'admin', 'meta' => ['reason' => $data['reason'] ?? null], 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Booking state overridden', 'data' => $booking->fresh()]);
    }

    /** POST /api/admin/bookings-workflow/{id}/internal-note */
    public function addInternalNote(Request $request, int $id)
    {
        $data = $request->validate(['note' => ['required', 'string']]);
        $note = AdminBookingInternalNote::create(['booking_id' => $id, 'admin_id' => $request->user()->admin_id, 'note' => $data['note'], 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Note added', 'data' => $note], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/tag */
    public function tag(Request $request, int $id)
    {
        $data = $request->validate(['tag_id' => ['required', 'integer']]);
        $tag = MapBookingTag::where('booking_id', $id)->where('tag_id', $data['tag_id'])->first();
        if (! $tag) {
            $tag = MapBookingTag::create(['booking_id' => $id, 'tag_id' => $data['tag_id'], 'tagged_by' => $request->user()->admin_id, 'created_at' => now()]);
        }

        return response()->json(['status' => true, 'message' => 'Booking tagged', 'data' => $tag], 201);
    }

    /** GET /api/admin/bookings-workflow/tags */
    public function tags()
    {
        return response()->json(['status' => true, 'data' => AdminBookingTag::where('is_active', true)->get()]);
    }

    // ── Dispatch ──
    /** GET /api/admin/bookings-workflow/{id}/nearby-technicians */
    public function nearbyTechnicians(Request $request, int $id)
    {
        $booking = Booking::findOrFail($id);
        $address = DB::table('efm_customer_address')->where('address_id', $booking->address_id)->first();
        abort_if(! $address || ! is_numeric($address->latitude), 400, 'Booking address has no coordinates');

        $radiusKm = min(50, (float) $request->query('radius_km', 10));
        $rows = TechnicianLiveLocation::query()->get()->filter(function ($loc) use ($address, $radiusKm) {
            return GeoAreaResolver::haversineDistanceKm((float) $loc->lat, (float) $loc->lng, (float) $address->latitude, (float) $address->longitude) <= $radiusKm;
        })->map(function ($loc) use ($address) {
            return ['technician_id' => $loc->technician_id, 'distance_km' => round(GeoAreaResolver::haversineDistanceKm((float) $loc->lat, (float) $loc->lng, (float) $address->latitude, (float) $address->longitude), 2)];
        })->sortBy('distance_km')->values();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /**
     * POST /api/admin/bookings-workflow/{id}/dispatch — manual dispatch (writes the
     * offer/assignment directly, no broadcast/first-accept-wins per the foundation
     * phase's scope decision).
     */
    public function dispatch(Request $request, int $id)
    {
        $data = $request->validate(['technician_id' => ['required', 'integer']]);
        $booking = Booking::findOrFail($id);
        $offer = DispatchJobOffer::create([
            'booking_id' => $id, 'technician_id' => $data['technician_id'], 'wave' => 1,
            'status' => 'offered', 'expires_at' => now()->addMinutes(2), 'created_at' => now(),
        ]);
        $booking->update(['booking_status_id' => BookingStatus::BROADCASTED, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Job offer dispatched', 'data' => $offer], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/assign-multiple */
    public function assignMultiple(Request $request, int $id)
    {
        $data = $request->validate(['technician_ids' => ['required', 'array'], 'technician_ids.*' => ['integer']]);
        $booking = Booking::findOrFail($id);
        $offers = [];
        foreach ($data['technician_ids'] as $techId) {
            $offers[] = DispatchJobOffer::create(['booking_id' => $id, 'technician_id' => $techId, 'wave' => 1, 'status' => 'offered', 'expires_at' => now()->addMinutes(2), 'created_at' => now()]);
        }
        $booking->update(['booking_status_id' => BookingStatus::BROADCASTED, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Job offered to multiple technicians', 'data' => $offers], 201);
    }

    /** POST /api/admin/bookings-workflow/{id}/auto-assign */
    public function autoAssign(Request $request, int $id)
    {
        $nearby = json_decode($this->nearbyTechnicians($request, $id)->getContent(), true)['data'] ?? [];
        abort_if(empty($nearby), 404, 'No nearby technicians available');

        $best = $nearby[0];
        $booking = Booking::findOrFail($id);
        BookingTechnician::create(['technician_id' => $best['technician_id'], 'booking_id' => $id, 'assignment_role' => 'primary', 'is_primary' => true, 'assigned_at' => now(), 'is_active' => true, 'created_by' => 'admin', 'created_at' => now()]);
        $booking->update(['technician_id' => $best['technician_id'], 'booking_status_id' => BookingStatus::TECH_ACCEPTED, 'assigned_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Auto-assigned nearest technician', 'data' => $booking->fresh()]);
    }

    // ── SLA policies ──
    /** GET /api/admin/bookings-workflow/sla-policies */
    public function slaPolicies()
    {
        return response()->json(['status' => true, 'data' => \Efixmate\Domain\Models\AdminBookingSlaPolicy::where('is_active', true)->get()]);
    }
}
