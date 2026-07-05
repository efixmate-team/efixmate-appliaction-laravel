<?php

namespace App\Listeners;

use App\Events\BookingConfirmed;
use App\Jobs\SendNotificationJob;

/**
 * Direct port of the BOOKING_CONFIRMED handler in
 * server/src/modules/user/Booking/Listeners/booking.listeners.js: dispatches a
 * customer push notification + an SMS (MSG91 in Node — no SMS gateway ported yet,
 * see class docblock note). Node also has CREATED/ACCEPTED/COMPLETED/CANCELLED
 * listeners with their own side effects (booking-timeout job, tech-assigned SMS,
 * settlement enqueue, cancellation SMS) — add those as their own Event+Listener
 * pairs in Stage 3 once the real confirm/cancel/complete-service endpoints exist
 * to fire them from, following this same pattern.
 */
class SendBookingConfirmedNotifications
{
    public function handle(BookingConfirmed $event): void
    {
        SendNotificationJob::dispatch([
            'event_type' => 'booking_confirmed',
            'audience' => 'customer',
            'booking_id' => $event->bookingId,
        ]);

        // SMS send (smsBookingConfirmed in Node, via MSG91) — no SMS gateway client
        // ported yet; CustomerOtpController's LogSmsGateway stub is OTP-specific.
        // Wire a real send here once a general-purpose SMS service exists.
    }
}
