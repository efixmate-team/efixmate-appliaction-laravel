<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasDefaultJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Direct job-shape port of platform-notification
 * (queues/workers/notification.worker.js + notificationOrchestrator.service.js),
 * fed by the admin notifications module's send/broadcast/send-single endpoints
 * (Stage 7) and by booking.listeners.js's push-on-confirm side effect (Stage 3/4).
 * Real FCM/SMS delivery logic wired in whichever stage first needs to actually
 * send something.
 */
class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, HasDefaultJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        // Real push/SMS delivery logic not yet ported — see class docblock.
    }
}
