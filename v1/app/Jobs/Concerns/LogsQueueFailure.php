<?php

namespace App\Jobs\Concerns;

use Efixmate\Domain\Models\ModuleQueueFailure;

/**
 * Direct port of queueFactory.js's logQueueFailure() — dead-letters into
 * efm_module_queue_failures, matching the table admin/ops's DLQ endpoints (Stage 7)
 * read from and replay via.
 */
trait LogsQueueFailure
{
    public function failed(\Throwable $exception): void
    {
        $isDeadLetter = $this->attempts() >= $this->tries;

        ModuleQueueFailure::create([
            'module' => 'platform',
            'queue_name' => $this->queue ?? 'default',
            'job_name' => static::class,
            'payload' => property_exists($this, 'data') ? $this->data : [],
            'error_message' => $exception->getMessage(),
            'attempts' => $this->attempts(),
            'replay_count' => 0,
            'dead_letter_at' => $isDeadLetter ? now() : null,
            'created_at' => now(),
        ]);
    }
}
