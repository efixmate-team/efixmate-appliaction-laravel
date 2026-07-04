<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;

/**
 * Technician-facing job status transitions. Assignment itself is admin-initiated
 * (Stage 7) — there is no dispatch/broadcast/first-accept-wins in this phase, so a
 * technician can only act on a booking they're already assigned to via
 * efm_booking_technicians. Commission/settlement/wallet crediting on completion is
 * stubbed — see Stage 6 in the migration plan.
 */
class TechnicianBookingController extends Controller
{
    /** POST /api/technician/booking/{id}/start-service */
    public function startService(Request $request, int $bookingId)
    {
        $assignment = $this->assignedTo($request, $bookingId);

        $assignment->update(['started_at' => now()]);
        $booking = Booking::findOrFail($bookingId);
        $booking->update([
            'booking_status_id' => BookingStatus::IN_PROGRESS,
            'lifecycle_state' => 'JOB_STARTED',
            'started_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $booking]);
    }

    /** POST /api/technician/booking/{id}/complete-service */
    public function completeService(Request $request, int $bookingId)
    {
        $assignment = $this->assignedTo($request, $bookingId);

        $assignment->update(['completed_at' => now()]);
        $booking = Booking::findOrFail($bookingId);
        $booking->update([
            'booking_status_id' => BookingStatus::COMPLETED,
            'lifecycle_state' => 'JOB_COMPLETED',
            'completed_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $booking]);
    }

    private function assignedTo(Request $request, int $bookingId): BookingTechnician
    {
        return BookingTechnician::where('booking_id', $bookingId)
            ->where('technician_id', $request->user()->technician_id)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
