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
 * Direct job-shape port of platform-settlement (queues/workers/settlement.worker.js),
 * enqueued by enqueueSettlementForBooking() on booking completion. Settles
 * technician payout/commission and accrues customer loyalty points in Node — real
 * settlement logic is stubbed per the foundation phase's booking-slice scoping;
 * fill in handle() when a later stage implements commission/settlement for real.
 */
class SettleBookingJob implements ShouldQueue
{
    use Dispatchable, HasCriticalJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        // Real settlement logic not yet ported — see class docblock.
    }
}
