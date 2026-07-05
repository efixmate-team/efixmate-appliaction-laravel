<?php

namespace App\Http\Controllers;

use App\Services\FileUploadService;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingMedia;
use Efixmate\Domain\Models\BookingNote;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\Invoice;
use Efixmate\Domain\Support\BookingStatus;
use Efixmate\Domain\Support\UploadSlots;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Direct port of server/src/modules/user/Booking/Services/bookingFeature.service.js
 * (reschedule, timeline, repeat, emergency, recurring, cancel, notes, media upload,
 * invoice). BookingStateService's lifecycle-state-machine side effect on cancel is a
 * best-effort no-op elsewhere in Node (wrapped in .catch(() = {})); not replicated
 * here since lifecycle_state is set directly, matching the same net DB effect.
 */
class BookingFeatureController extends Controller
{
    private const CANCELLABLE = [
        BookingStatus::PENDING, BookingStatus::CONFIRMED_LEGACY,
        BookingStatus::BROADCASTED, BookingStatus::TECH_ACCEPTED,
    ];

    public function __construct(private FileUploadService $uploads) {}

    private function ownBooking(Request $request, int $bookingId): Booking
    {
        $booking = Booking::where('booking_id', $bookingId)->where('customer_id', $request->user()->customer_id)->first();
        abort_if(! $booking, 404, 'Booking not found');

        return $booking;
    }

    /** POST /api/user/booking/reschedule */
    public function reschedule(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $booking = $this->ownBooking($request, $bookingId);
        abort_unless(in_array((int) $booking->booking_status_id, self::CANCELLABLE, true), 400, 'Booking cannot be rescheduled in current status');

        $oldStatus = $booking->booking_status_id;
        $booking->update([
            'slot_id' => $request->input('slot_id') ?? $request->input('slotId') ?? $booking->slot_id,
            'scheduled_date' => $request->input('scheduled_date') ?? $request->input('scheduledDate') ?? $booking->scheduled_date,
            'scheduled_time' => $request->input('scheduled_time') ?? $request->input('scheduledTime') ?? $booking->scheduled_time,
            'updated_at' => now(),
        ]);

        BookingStatusLog::create([
            'booking_id' => $bookingId, 'old_status' => $oldStatus, 'new_status' => $oldStatus,
            'changed_by' => (string) $request->user()->customer_id, 'remark' => 'Rescheduled by customer', 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Booking rescheduled', 'data' => ['booking' => $booking->fresh()]]);
    }

    /** GET /api/user/bookings/{bookingId}/timeline */
    public function timeline(Request $request, int $bookingId)
    {
        $this->ownBooking($request, $bookingId);

        $logs = BookingStatusLog::where('booking_id', $bookingId)->orderBy('created_at')->get(['log_id', 'old_status', 'new_status', 'changed_by', 'remark', 'created_at']);

        return response()->json(['status' => true, 'message' => 'Timeline fetched', 'data' => ['timeline' => $logs]]);
    }

    /** POST /api/user/booking/repeat */
    public function repeat(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $source = $this->ownBooking($request, $bookingId);
        $customerId = $request->user()->customer_id;

        $dup = Booking::create([
            'booking_uid' => Str::upper('EFX'.now()->timestamp),
            'customer_id' => $customerId,
            'address_id' => $source->address_id,
            'service_category_id' => $source->service_category_id,
            'service_id' => $source->service_id,
            'booking_type_id' => $source->booking_type_id,
            'quantity' => $source->quantity,
            'base_price' => $source->base_price,
            'unit_price' => $source->unit_price,
            'booking_status_id' => BookingStatus::PENDING,
            'payment_status_id' => $source->payment_status_id,
            'problem_description' => $source->problem_description,
            'scheduled_date' => $source->scheduled_date,
            'scheduled_time' => $source->scheduled_time,
            'area_id' => $source->area_id,
            'slot_id' => $source->slot_id,
            'fy_id' => $source->fy_id,
            'is_active' => true,
            'lifecycle_state' => 'CREATED',
            'created_by' => (string) $customerId,
            'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Booking repeated', 'data' => ['booking_id' => $dup->booking_id]]);
    }

    /** POST /api/user/booking/emergency */
    public function emergency(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        abort_if(! $bookingId, 400, 'booking_id is required for emergency flag');

        $booking = $this->ownBooking($request, $bookingId);
        $snapshot = json_decode($booking->problem_description ?? '{}', true);
        if (! is_array($snapshot)) {
            $snapshot = ['note' => $booking->problem_description];
        }
        $snapshot['emergency'] = true;

        $booking->update(['problem_description' => json_encode($snapshot), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Emergency booking updated', 'data' => ['booking' => $booking->fresh(), 'emergency' => true]]);
    }

    /** POST /api/user/booking/recurring */
    public function recurring(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $frequency = $request->input('frequency', 'weekly');
        $booking = $this->ownBooking($request, $bookingId);

        $recurring = ['frequency' => $frequency, 'parent_booking_id' => $bookingId];
        $booking->update([
            'problem_description' => json_encode(['v' => 1, 'recurring' => $recurring, 'note' => $booking->problem_description]),
            'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Recurring schedule saved', 'data' => ['booking' => $booking->fresh(), 'recurring' => $recurring]]);
    }

    /** POST /api/user/booking/cancel */
    public function cancel(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $booking = $this->ownBooking($request, $bookingId);
        abort_unless(in_array((int) $booking->booking_status_id, self::CANCELLABLE, true), 400, 'Booking cannot be cancelled');

        $oldStatus = $booking->booking_status_id;
        $booking->update(['booking_status_id' => BookingStatus::CANCELLED, 'cancelled_at' => now(), 'lifecycle_state' => 'CANCELLED']);

        BookingStatusLog::create([
            'booking_id' => $bookingId, 'old_status' => $oldStatus, 'new_status' => BookingStatus::CANCELLED,
            'changed_by' => (string) $request->user()->customer_id,
            'remark' => $request->input('reason') ?: 'Cancelled by customer', 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Booking cancelled', 'data' => ['booking' => $booking->fresh()]]);
    }

    /** POST /api/user/booking/notes */
    public function notes(Request $request)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $this->ownBooking($request, $bookingId);

        $note = trim((string) $request->input('note', ''));
        abort_if($note === '', 400, 'note is required');

        $customerId = $request->user()->customer_id;
        $saved = BookingNote::create(['booking_id' => $bookingId, 'customer_id' => $customerId, 'note' => $note, 'created_at' => now()]);
        $history = BookingNote::where('booking_id', $bookingId)->orderByDesc('created_at')->get(['note_id', 'note', 'created_at']);

        return response()->json(['status' => true, 'message' => 'Note saved', 'data' => ['note' => $saved, 'history' => $history]]);
    }

    /** POST /api/user/booking/upload-images */
    public function uploadImages(Request $request)
    {
        return $this->saveMedia($request, 'image');
    }

    /** POST /api/user/booking/upload-video */
    public function uploadVideo(Request $request)
    {
        return $this->saveMedia($request, 'video');
    }

    private function saveMedia(Request $request, string $mediaType)
    {
        $bookingId = (int) ($request->input('booking_id') ?? $request->input('bookingId'));
        $this->ownBooking($request, $bookingId);

        $file = $request->file($mediaType === 'video' ? 'video' : 'image');
        abort_if(! $file, 400, 'File is required');

        $customerId = $request->user()->customer_id;
        $slot = $mediaType === 'video' ? UploadSlots::USER_BOOKING_VIDEOS : UploadSlots::USER_BOOKING_IMAGES;
        $path = $this->uploads->store($file, $slot, $customerId);

        $media = BookingMedia::create([
            'booking_id' => $bookingId, 'customer_id' => $customerId,
            'media_type' => $mediaType, 'url' => "uploads/{$path}", 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => ucfirst($mediaType).'s uploaded', 'data' => ['media' => $media]]);
    }

    /** GET /api/user/bookings/{bookingId}/invoice */
    public function invoice(Request $request, int $bookingId)
    {
        $booking = $this->ownBooking($request, $bookingId);

        $invoice = Invoice::where('booking_id', $bookingId)->orderByDesc('invoice_id')->first();
        $amount = (float) ($booking->final_price ?? $booking->estimated_price ?? $booking->unit_price ?? 0);

        return response()->json(['status' => true, 'message' => 'Invoice fetched', 'data' => [
            'booking_id' => $bookingId,
            'booking_uid' => $booking->booking_uid,
            'invoice' => $invoice,
            'amount' => $amount,
            'pdf_ready' => (bool) $invoice,
        ]]);
    }
}
