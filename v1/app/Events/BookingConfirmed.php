<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Direct port of the BOOKING_EVENTS.BOOKING_CONFIRMED event fired from
 * server/src/modules/user/Booking/Events/booking.events.js (a hand-rolled
 * in-memory pub/sub) — Laravel's native Event/Listener system replaces that
 * custom emitter directly, no adaptation needed. Fired from the real
 * POST /customer/booking/confirm handler once Stage 3/4 builds it.
 */
class BookingConfirmed
{
    use Dispatchable, SerializesModels;

    public function __construct(public int $bookingId) {}
}
