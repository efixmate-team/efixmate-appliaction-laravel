<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianLiveLocation;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Support\Facades\DB;

/**
 * Polling-fallback reads that mirror the realtime data Node also pushes over
 * Socket.IO (see server/.../admin/realtime.routes.js). No WebSocket delivery in
 * this port (out of scope) — these plain HTTP reads cover the same data.
 */
class AdminRealtimeController extends Controller
{
    /** GET /api/admin/realtime/dashboard-metrics */
    public function dashboardMetrics()
    {
        return response()->json(['status' => true, 'data' => [
            'active_bookings' => Booking::whereIn('booking_status_id', [
                BookingStatus::PENDING, BookingStatus::BROADCASTED, BookingStatus::TECH_ACCEPTED,
                BookingStatus::ON_THE_WAY, BookingStatus::ARRIVED, BookingStatus::STARTED,
            ])->count(),
            'online_technicians' => Technician::where('is_online', true)->count(),
            'as_of' => now()->toIso8601String(),
        ]]);
    }

    /** GET /api/admin/realtime/technician-positions */
    public function technicianPositions()
    {
        $rows = DB::table('efm_technician_live_locations as l')
            ->join('efm_technicians as t', 't.technician_id', '=', 'l.technician_id')
            ->where('t.is_online', true)
            ->select('l.technician_id', 'l.lat', 'l.lng', 'l.updated_at', 't.first_name', 't.last_name')
            ->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/realtime/system-health */
    public function systemHealth()
    {
        $dbOk = true;
        try {
            DB::select('SELECT 1');
        } catch (\Throwable) {
            $dbOk = false;
        }

        return response()->json(['status' => true, 'data' => [
            'database' => $dbOk ? 'ok' : 'down',
            'queue_connection' => config('queue.default'),
            'as_of' => now()->toIso8601String(),
        ]]);
    }
}
