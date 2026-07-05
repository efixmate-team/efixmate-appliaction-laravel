<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\ServiceReview;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/user/controller/review.controller.js. */
class ReviewController extends Controller
{
    /** POST /api/user/bookings/{bookingId}/review */
    public function submit(Request $request, int $bookingId)
    {
        $customerId = $request->user()->customer_id;

        $data = $request->validate(['rating' => ['required', 'integer', 'min:1', 'max:5'], 'comment' => ['nullable', 'string']]);

        $booking = Booking::where('booking_id', $bookingId)->where('customer_id', $customerId)->first();
        abort_if(! $booking, 404, 'Booking not found');
        abort_if((int) $booking->booking_status_id !== BookingStatus::COMPLETED, 422, 'Reviews can only be submitted for completed bookings');

        $existing = ServiceReview::where('booking_id', $bookingId)->where('customer_id', $customerId)->first();

        if ($existing) {
            $existing->update(['rating' => $data['rating'], 'comment' => $data['comment'] ?? null, 'updated_at' => now()]);
            $this->refreshRatings($booking->service_id, $booking->technician_id);

            return response()->json(['status' => true, 'message' => 'Review updated', 'data' => $existing]);
        }

        $review = ServiceReview::create([
            'customer_id' => $customerId,
            'service_id' => $booking->service_id,
            'booking_id' => $bookingId,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'is_active' => true,
            'created_at' => now(),
        ]);
        $this->refreshRatings($booking->service_id, $booking->technician_id);

        return response()->json(['status' => true, 'message' => 'Review submitted', 'data' => $review], 201);
    }

    /** GET /api/user/bookings/{bookingId}/review */
    public function show(Request $request, int $bookingId)
    {
        $customerId = $request->user()->customer_id;

        $review = ServiceReview::where('booking_id', $bookingId)
            ->where('customer_id', $customerId)
            ->where('is_active', true)
            ->first();

        return response()->json(['status' => true, 'data' => $review]);
    }

    private function refreshRatings(?int $serviceId, ?int $technicianId): void
    {
        if ($serviceId) {
            $agg = ServiceReview::where('service_id', $serviceId)->where('is_active', true)
                ->selectRaw('ROUND(AVG(rating),2) as avg_rating, COUNT(*) as review_count')->first();
            MstrService::where('service_id', $serviceId)->update([
                'avg_rating' => $agg->avg_rating ?? 0,
                'review_count' => $agg->review_count ?? 0,
            ]);
        }

        if ($technicianId) {
            $agg = DB::table('efm_service_reviews as r')
                ->join('efm_bookings as b', 'b.booking_id', '=', 'r.booking_id')
                ->where('b.technician_id', $technicianId)->where('r.is_active', true)
                ->selectRaw('ROUND(AVG(r.rating),2) as avg_rating, COUNT(r.review_id) as review_count')
                ->first();
            Technician::where('technician_id', $technicianId)->update([
                'avg_rating' => $agg->avg_rating ?? 0,
                'review_count' => $agg->review_count ?? 0,
            ]);
        }
    }
}
