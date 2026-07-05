<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Models\Refund;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin-token-gated booking endpoints from server/src/modules/booking/routes/booking.routes.js —
 * mounted at the bare /booking/* prefix (not /customer/booking or /admin/*) for
 * structural parity with the Node route, per Stage 3 of the API-parity plan. The
 * outer Inertia app has its own booking-assignment UI/action (foundation phase);
 * both write to the same efm_booking_technicians table so they coexist safely.
 */
class AdminBookingController extends Controller
{
    private const STATUS_CASE_SQL = "CASE efm_bookings.booking_status_id WHEN 1 THEN 'PENDING' WHEN 2 THEN 'CONFIRMED' WHEN 3 THEN 'IN PROGRESS' WHEN 4 THEN 'COMPLETED' WHEN 5 THEN 'CANCELLED' WHEN 6 THEN 'FAILED' WHEN 7 THEN 'REFUNDED' WHEN 20 THEN 'BROADCASTED' WHEN 21 THEN 'TECH ACCEPTED' WHEN 22 THEN 'ON THE WAY' WHEN 23 THEN 'ARRIVED' WHEN 24 THEN 'STARTED' WHEN 25 THEN 'NO SERVICE' ELSE 'UNKNOWN' END as booking_status";

    /** GET /api/booking/all */
    public function all()
    {
        return response()->json(['success' => true, 'data' => ApiResponseFilter::filter(Booking::all()->toArray())]);
    }

    /** GET /api/booking/{id} */
    public function show(int $id)
    {
        $booking = Booking::findOrFail($id);
        $assignments = BookingTechnician::where('booking_id', $id)->get();

        return response()->json(['success' => true, 'data' => ['booking' => $booking, 'assignments' => $assignments]]);
    }

    /** POST /api/booking/admin-paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = (int) $request->input('limit', 10);
        $search = $request->input('search');
        $statusIn = $request->input('statusIn', []);

        $query = DB::table('efm_bookings')
            ->select(
                'efm_bookings.*',
                DB::raw(self::STATUS_CASE_SQL),
                'efm_mstr_services.service as service_name',
                'efm_mstr_service_category.category_name',
                'efm_customers.first_name', 'efm_customers.last_name', 'efm_customers.mobile_number',
            )
            ->leftJoin('efm_mstr_services', 'efm_bookings.service_id', '=', 'efm_mstr_services.service_id')
            ->leftJoin('efm_mstr_service_category', 'efm_bookings.service_category_id', '=', 'efm_mstr_service_category.category_id')
            ->leftJoin('efm_customers', 'efm_bookings.customer_id', '=', 'efm_customers.customer_id');

        if (! empty($statusIn)) {
            $query->whereIn('efm_bookings.booking_status_id', $statusIn);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('booking_uid', 'like', "%{$search}%")
                    ->orWhere('efm_mstr_services.service', 'like', "%{$search}%")
                    ->orWhere('efm_customers.first_name', 'like', "%{$search}%")
                    ->orWhere('efm_customers.last_name', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $data = $query->orderByDesc('booking_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true,
            'message' => 'Bookings fetched',
            'data' => ApiResponseFilter::filter($data->all()),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** POST /api/booking/admin-assignments */
    public function assignments(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = (int) $request->input('limit', 10);
        $search = $request->input('search');

        $query = DB::table('efm_booking_technicians')
            ->select(
                'efm_booking_technicians.*',
                'efm_technicians.first_name', 'efm_technicians.last_name', 'efm_technicians.mobile_number',
                'efm_bookings.booking_uid', 'efm_bookings.scheduled_date', 'efm_bookings.scheduled_time',
            )
            ->leftJoin('efm_technicians', 'efm_booking_technicians.technician_id', '=', 'efm_technicians.technician_id')
            ->leftJoin('efm_bookings', 'efm_booking_technicians.booking_id', '=', 'efm_bookings.booking_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('efm_technicians.first_name', 'like', "%{$search}%")
                    ->orWhere('booking_uid', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $data = $query->orderByDesc('asignment_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true,
            'message' => 'Assignments fetched',
            'data' => ApiResponseFilter::filter($data->all()),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /**
     * POST /api/booking/refund — direct port: bookkeeping-only, does NOT call a
     * live gateway refund API (matches Node's postRefund/refundBooking exactly).
     */
    public function refund(Request $request)
    {
        $data = $request->validate([
            'paymentId' => ['required', 'integer'],
            'amount' => ['required', 'numeric'],
            'reason' => ['nullable', 'string'],
        ]);

        $refund = Refund::create([
            'payment_id' => $data['paymentId'],
            'gateway_refund_id' => 'REF-'.now()->timestamp,
            'amount' => $data['amount'],
            'reason' => $data['reason'] ?? null,
            'refund_status_id' => 1,
            'refunded_at' => now(),
            'raw_response' => [],
            'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Refund initiated', 'data' => $refund]);
    }

    /** POST /api/booking/confirm */
    public function confirm(Request $request)
    {
        $data = $request->validate(['bookingId' => ['required', 'integer']]);
        $booking = Booking::findOrFail($data['bookingId']);

        BookingStatusLog::create([
            'booking_id' => $booking->booking_id,
            'old_status' => $booking->booking_status_id,
            'new_status' => BookingStatus::CONFIRMED_LEGACY,
            'changed_by' => 'system',
            'remark' => 'Booking confirmed',
            'created_at' => now(),
        ]);

        $booking->update(['booking_status_id' => BookingStatus::CONFIRMED_LEGACY]);

        return response()->json(['status' => true, 'message' => 'Booking confirmed', 'data' => $booking]);
    }

    /**
     * POST /api/booking/payment/webhook — direct port of PaymentController.handleWebhook.
     * Node's own handler has no signature verification or auth on this route (gateway
     * calls it directly), so this is ported as-is rather than hardened beyond parity.
     */
    public function paymentWebhook(Request $request)
    {
        $event = $request->input('event');
        $notes = $request->input('data.notes', []);

        try {
            if ($event === 'payment.captured') {
                $lockId = $notes['lock_id'] ?? null;
                $lock = BookingLock::find($lockId);
                if (! $lock) {
                    return response()->json(['status' => false, 'message' => 'Lock not found'], 404);
                }

                $booking = Booking::where('customer_id', $lock->customer_id)
                    ->where('scheduled_date', $lock->scheduled_date)
                    ->where('slot_id', $lock->slot_id)
                    ->first();

                if ($booking) {
                    $booking->update(['payment_status_id' => 2]);
                    BookingStatusLog::create([
                        'booking_id' => $booking->booking_id,
                        'old_status' => null,
                        'new_status' => 2,
                        'changed_by' => 'payment_gateway',
                        'remark' => 'Payment successful, booking confirmed',
                        'created_at' => now(),
                    ]);
                }
            } elseif ($event === 'payment.failed') {
                $lockId = $notes['lock_id'] ?? null;
                BookingLock::where('lock_id', $lockId)->update(['is_active' => false]);
            }

            return response()->json(['status' => true]);
        } catch (\Throwable $e) {
            return response()->json(['status' => false], 500);
        }
    }

    /** POST /api/booking/assign-technician */
    public function assignTechnician(Request $request)
    {
        $data = $request->validate([
            'bookingId' => ['required', 'integer'],
            'technicianId' => ['required', 'integer'],
            'statusId' => ['nullable', 'integer'],
        ]);

        $booking = Booking::findOrFail($data['bookingId']);

        $assignment = BookingTechnician::create([
            'technician_id' => $data['technicianId'],
            'booking_id' => $data['bookingId'],
            'assignment_role' => 'primary',
            'is_primary' => true,
            'assigned_at' => now(),
            'is_active' => true,
            'created_by' => $data['createdBy'] ?? 'admin',
            'created_at' => now(),
        ]);

        $booking->update([
            'booking_status_id' => $data['statusId'] ?? BookingStatus::TECH_ACCEPTED,
            'assigned_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => ['assignment' => $assignment, 'booking' => $booking], 'message' => 'Technician assigned']);
    }
}
