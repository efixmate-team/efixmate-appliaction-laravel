<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Mapped to client/app/admin/booking-management/{bookings,workflow}/[bookingId] in the
 * source Next.js app — see Stage 7 in the migration plan. Assignment here is admin-only:
 * there's no dispatch/broadcast/first-accept-wins in this phase.
 */
class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = Booking::with(['customer:customer_id,first_name,last_name,mobile_number', 'service:service_id,service'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(fn ($q) => $q->where('booking_uid', 'like', "%{$search}%"));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('booking_status_id', $request->integer('status')))
            ->orderByDesc('booking_id')
            ->paginate(15)
            ->withQueryString();

        $bookings->getCollection()->transform(function (Booking $booking) {
            $booking->status_label = BookingStatus::label($booking->booking_status_id);

            return $booking;
        });

        return Inertia::render('Admin/BookingManagement/Bookings/Index', [
            'bookings' => $bookings,
            'filters' => $request->only(['search', 'status']),
            'statuses' => $this->statusOptions(),
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load(['customer', 'service', 'pricingSnapshot', 'priceBreakdown.lines', 'assignments.technician']);
        $booking->status_label = BookingStatus::label($booking->booking_status_id);

        return Inertia::render('Admin/BookingManagement/Bookings/Show', [
            'booking' => $booking,
            'availableTechnicians' => Technician::where('is_active', true)
                ->where('application_status', 'approved')
                ->get(['technician_id', 'first_name', 'last_name', 'mobile_number', 'current_jobs', 'max_jobs']),
        ]);
    }

    public function assignTechnician(Request $request, Booking $booking)
    {
        $data = $request->validate(['technician_id' => ['required', 'integer', 'exists:efm_technicians,technician_id']]);

        BookingTechnician::create([
            'technician_id' => $data['technician_id'],
            'booking_id' => $booking->booking_id,
            'assignment_role' => 'primary',
            'is_primary' => true,
            'assigned_at' => now(),
            'is_active' => true,
            'created_by' => 'admin:' . auth()->id(),
            'created_at' => now(),
        ]);

        $booking->update([
            'technician_id' => $data['technician_id'],
            'booking_status_id' => BookingStatus::TECH_ACCEPTED,
            'lifecycle_state' => 'TECHNICIAN_ASSIGNED',
            'assigned_at' => now(),
        ]);

        return redirect()->route('admin.booking-management.bookings.show', $booking)
            ->with('success', 'Technician assigned.');
    }

    private function statusOptions(): array
    {
        return [
            BookingStatus::PENDING => BookingStatus::label(BookingStatus::PENDING),
            BookingStatus::IN_PROGRESS => BookingStatus::label(BookingStatus::IN_PROGRESS),
            BookingStatus::COMPLETED => BookingStatus::label(BookingStatus::COMPLETED),
            BookingStatus::CANCELLED => BookingStatus::label(BookingStatus::CANCELLED),
            BookingStatus::TECH_ACCEPTED => BookingStatus::label(BookingStatus::TECH_ACCEPTED),
        ];
    }
}
