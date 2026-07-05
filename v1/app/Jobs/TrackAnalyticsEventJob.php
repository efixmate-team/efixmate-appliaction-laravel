<?php

namespace App\Jobs;

use App\Jobs\Concerns\HasDefaultJobRetry;
use App\Jobs\Concerns\LogsQueueFailure;
use Efixmate\Domain\Models\AnalyticsEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Direct port of platform-analytics (queues/workers/analytics.worker.js) — a
 * generic event-tracking sink, simple enough to implement in full here rather
 * than stub (unlike this file's siblings, which need business logic from later
 * stages).
 */
class TrackAnalyticsEventJob implements ShouldQueue
{
    use Dispatchable, HasDefaultJobRetry, InteractsWithQueue, LogsQueueFailure, Queueable, SerializesModels;

    public function __construct(public array $data) {}

    public function handle(): void
    {
        AnalyticsEvent::create([
            'event_name' => $this->data['event_name'] ?? $this->data['eventName'] ?? 'unknown',
            'entity_type' => $this->data['entity_type'] ?? $this->data['entityType'] ?? null,
            'entity_id' => isset($this->data['entity_id']) ? (string) $this->data['entity_id'] : null,
            'payload' => $this->data['payload'] ?? $this->data,
            'created_at' => now(),
        ]);
    }
}
