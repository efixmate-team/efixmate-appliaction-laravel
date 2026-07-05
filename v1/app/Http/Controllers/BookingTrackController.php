<?php

namespace App\Http\Controllers;

use App\Services\BookingCheckoutHelperService;
use App\Support\GeoAreaResolver;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianLiveLocation;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of handleBookingTrackJob in server/.../bookingTrack.controller.js. */
class BookingTrackController extends Controller
{
    private const AVG_SPEED_KMPH = 25.0;

    public function __construct(private BookingCheckoutHelperService $helper) {}

    /** GET /api/user/bookings/{bookingId}/track */
    public function track(Request $request, int $bookingId)
    {
        $customerId = $request->user()->customer_id;
        $booking = $this->helper->loadOwnBooking($customerId, $bookingId);
        abort_if(! $booking, 404, 'Booking not found');

        $technician = null;
        $liveLocation = null;
        $etaMinutes = null;
        $distanceKm = null;

        if ($booking->technician_id) {
            $technician = Technician::find($booking->technician_id);
            $liveLocation = TechnicianLiveLocation::where('technician_id', $booking->technician_id)->first();

            $address = DB::table('efm_customer_address')->where('address_id', $booking->address_id)->first();
            if ($liveLocation && $address && is_numeric($address->latitude) && is_numeric($address->longitude)) {
                $distanceKm = round(GeoAreaResolver::haversineDistanceKm(
                    (float) $liveLocation->lat, (float) $liveLocation->lng,
                    (float) $address->latitude, (float) $address->longitude
                ), 2);
                $etaMinutes = (int) ceil(($distanceKm / self::AVG_SPEED_KMPH) * 60);
            }
        }

        $logs = BookingStatusLog::where('booking_id', $bookingId)->orderBy('created_at')->get(['old_status', 'new_status', 'remark', 'created_at']);

        $timeline = $this->helper->buildTimeline($booking);

        $isLive = in_array((int) $booking->booking_status_id, [
            BookingStatus::TECH_ACCEPTED, BookingStatus::ON_THE_WAY, BookingStatus::ARRIVED, BookingStatus::STARTED,
        ], true);

        return response()->json(['status' => true, 'data' => [
            'booking_id' => $booking->booking_id, 'booking_uid' => $booking->booking_uid,
            'booking_status_id' => $booking->booking_status_id, 'booking_status_label' => $booking->booking_status_label,
            'is_live' => $isLive,
            'technician' => $technician ? [
                'technician_id' => $technician->technician_id,
                'name' => trim("{$technician->first_name} {$technician->last_name}"),
                'mobile_number' => $technician->mobile_number,
                'profile_pitcher' => PublicUrlResolver::resolve($request, $technician->profile_pitcher),
                'avg_rating' => $technician->avg_rating,
            ] : null,
            'live_location' => $liveLocation ? [
                'lat' => (float) $liveLocation->lat, 'lng' => (float) $liveLocation->lng, 'updated_at' => $liveLocation->updated_at,
            ] : null,
            'distance_km' => $distanceKm,
            'eta_minutes' => $etaMinutes,
            'timeline' => $timeline,
            'status_logs' => $logs,
        ]]);
    }
}
