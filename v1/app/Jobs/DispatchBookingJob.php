<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasCriticalJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Direct job-shape port of platform-dispatch (queues/workers/dispatch.worker.js),
 * enqueued by enqueueDispatchForBooking(bookingId). Real dispatch logic (finding/
 * offering technicians for a booking) is out of scope for the foundation phase's
 * booking slice — this job exists so later stages have a queue to dispatch onto;
 * fill in handle() when a stage actually needs broadcast/first-accept-wins dispatch.
 */
class DispatchBookingJob implements ShouldQueue
{
    use Dispatchable, HasCriticalJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        // Real dispatch logic not yet ported — see class docblock.
    }
}
