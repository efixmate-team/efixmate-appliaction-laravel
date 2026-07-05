<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\CrmComplaint;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianPerformanceSnapshot;
use Efixmate\Domain\Models\TechnicianSuspension;
use Illuminate\Http\Request;

/** Direct port of the technicians-ops cluster in server/.../admin/techniciansOps.routes.js (9 endpoints). */
class AdminTechnicianOpsController extends Controller
{
    /** POST /api/admin/technicians-ops/{id}/suspend */
    public function suspend(Request $request, int $id)
    {
        $data = $request->validate(['reason' => ['required', 'string']]);
        $technician = Technician::findOrFail($id);
        $technician->update(['is_active' => false, 'updated_at' => now()]);
        $suspension = TechnicianSuspension::create([
            'technician_id' => $id, 'reason' => $data['reason'], 'suspended_by' => $request->user()->admin_id,
            'suspended_at' => now(), 'is_active' => true,
        ]);

        return response()->json(['status' => true, 'message' => 'Technician suspended', 'data' => $suspension], 201);
    }

    /** POST /api/admin/technicians-ops/{id}/reinstate */
    public function reinstate(Request $request, int $id)
    {
        $technician = Technician::findOrFail($id);
        $technician->update(['is_active' => true, 'updated_at' => now()]);
        TechnicianSuspension::where('technician_id', $id)->where('is_active', true)
            ->update(['is_active' => false, 'reinstated_by' => $request->user()->admin_id, 'reinstated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Technician reinstated']);
    }

    /** POST /api/admin/technicians-ops/{id}/force-offline */
    public function forceOffline(int $id)
    {
        $technician = Technician::findOrFail($id);
        $technician->update(['is_online' => false, 'availability_status' => 'OFFLINE', 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Technician forced offline', 'data' => $technician->fresh()]);
    }

    /** POST /api/admin/technicians-ops/{id}/reassign */
    public function reassign(Request $request, int $id)
    {
        $data = $request->validate(['booking_id' => ['required', 'integer'], 'new_technician_id' => ['required', 'integer']]);
        $booking = Booking::where('booking_id', $data['booking_id'])->where('technician_id', $id)->firstOrFail();
        $booking->update(['technician_id' => $data['new_technician_id'], 'assigned_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Booking reassigned', 'data' => $booking->fresh()]);
    }

    /** GET /api/admin/technicians-ops/{id}/performance */
    public function performance(int $id)
    {
        $snapshot = TechnicianPerformanceSnapshot::find($id);
        if (! $snapshot) {
            $total = Booking::where('technician_id', $id)->count();
            $completed = Booking::where('technician_id', $id)->where('booking_status_id', 4)->count();
            $bookingIds = Booking::where('technician_id', $id)->pluck('booking_id');
            $snapshot = TechnicianPerformanceSnapshot::create([
                'technician_id' => $id, 'acceptance_ratio' => 0,
                'completion_ratio' => $total > 0 ? round($completed / $total * 100, 2) : 0,
                'avg_rating' => Technician::find($id)?->avg_rating ?? 0,
                'complaints_count' => CrmComplaint::whereIn('booking_id', $bookingIds)->count(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['status' => true, 'data' => $snapshot]);
    }

    /** GET /api/admin/technicians-ops/{id}/complaints */
    public function complaints(int $id)
    {
        $bookingIds = Booking::where('technician_id', $id)->pluck('booking_id');
        $rows = CrmComplaint::whereIn('booking_id', $bookingIds)->orderByDesc('complaint_id')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/technicians-ops/{id}/jobs */
    public function jobs(Request $request, int $id)
    {
        $limit = min(100, (int) $request->query('limit', 25));

        return response()->json(['status' => true, 'data' => Booking::where('technician_id', $id)->orderByDesc('booking_id')->limit($limit)->get()]);
    }

    /** GET /api/admin/technicians-ops/{id}/earnings */
    public function earnings(int $id)
    {
        $total = Booking::where('technician_id', $id)->where('booking_status_id', 4)->sum('final_price');

        return response()->json(['status' => true, 'data' => ['total_earnings' => (float) $total]]);
    }

    /** GET /api/admin/technicians-ops/suspended */
    public function suspended()
    {
        return response()->json(['status' => true, 'data' => TechnicianSuspension::where('is_active', true)->orderByDesc('suspended_at')->get()]);
    }
}
