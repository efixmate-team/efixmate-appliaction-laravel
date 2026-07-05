<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Models\DispatchJobOffer;
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

    /**
     * POST /api/technician/booking/{id}/reject — direct port of rejectBooking()'s
     * two branches. Node's non-broadcast branch also calls a next-technician
     * auto-reassignment routine (reassignBookingLogic) — that's dispatch/broadcast
     * logic, out of scope per the foundation phase's scoping (no first-accept-wins
     * dispatch); this just reverts the booking to PENDING for admin-manual
     * reassignment instead.
     */
    public function reject(Request $request, int $bookingId)
    {
        $data = $request->validate(['reason' => ['nullable', 'string']]);
        $technicianId = $request->user()->technician_id;

        $booking = Booking::findOrFail($bookingId);

        if ((int) $booking->booking_status_id === BookingStatus::BROADCASTED) {
            DispatchJobOffer::where('booking_id', $bookingId)
                ->where('technician_id', $technicianId)
                ->where('status', 'pending')
                ->update(['status' => 'superseded']);

            BookingStatusLog::create([
                'booking_id' => $bookingId,
                'old_status' => $booking->booking_status_id,
                'new_status' => $booking->booking_status_id,
                'changed_by' => "technician_{$technicianId}",
                'remark' => 'Technician declined broadcast offer: '.($data['reason'] ?? ''),
                'created_at' => now(),
            ]);

            return response()->json(['status' => true, 'message' => 'Offer withdrawn; dispatch continues with other technicians.']);
        }

        BookingStatusLog::create([
            'booking_id' => $bookingId,
            'old_status' => $booking->booking_status_id,
            'new_status' => BookingStatus::PENDING,
            'changed_by' => "technician_{$technicianId}",
            'remark' => 'Rejected by technician: '.($data['reason'] ?? ''),
            'created_at' => now(),
        ]);

        $booking->update(['booking_status_id' => BookingStatus::PENDING, 'lifecycle_state' => 'CREATED']);

        BookingTechnician::where('booking_id', $bookingId)
            ->where('technician_id', $technicianId)
            ->update(['is_active' => false]);

        return response()->json(['status' => true, 'message' => 'Booking rejected; awaiting reassignment.']);
    }

    private function assignedTo(Request $request, int $bookingId): BookingTechnician
    {
        return BookingTechnician::where('booking_id', $bookingId)
            ->where('technician_id', $request->user()->technician_id)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
