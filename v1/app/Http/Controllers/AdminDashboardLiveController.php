<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Support\Facades\DB;

/** Direct port of the admin/dashboard-live polling-fallback cluster (5 endpoints). */
class AdminDashboardLiveController extends Controller
{
    /** GET /api/admin/dashboard-live/booking-funnel */
    public function bookingFunnel()
    {
        $today = now()->toDateString();
        $rows = DB::table('efm_bookings')->whereDate('created_at', $today)
            ->selectRaw('booking_status_id, COUNT(*) as total')->groupBy('booking_status_id')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/dashboard-live/technician-availability */
    public function technicianAvailability()
    {
        $rows = Technician::selectRaw('availability_status, COUNT(*) as total')->groupBy('availability_status')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/dashboard-live/pending-actions */
    public function pendingActions()
    {
        return response()->json(['status' => true, 'data' => [
            'unassigned_bookings' => Booking::whereNull('technician_id')->where('booking_status_id', BookingStatus::PENDING)->count(),
            'broadcasted_awaiting_accept' => Booking::where('booking_status_id', BookingStatus::BROADCASTED)->count(),
        ]]);
    }

    /** GET /api/admin/dashboard-live/sla-breaches */
    public function slaBreaches()
    {
        $rows = Booking::whereNotNull('sla_due_at')->where('sla_due_at', '<', now())
            ->whereNotIn('booking_status_id', [BookingStatus::COMPLETED, BookingStatus::CANCELLED, BookingStatus::REFUNDED])
            ->orderBy('sla_due_at')->limit(50)->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/dashboard-live/revenue-today */
    public function revenueToday()
    {
        $total = Booking::whereDate('created_at', now()->toDateString())->where('payment_status_id', 2)
            ->sum(DB::raw('COALESCE(final_price, estimated_price, 0)'));

        return response()->json(['status' => true, 'data' => ['revenue_today' => (float) $total]]);
    }
}
