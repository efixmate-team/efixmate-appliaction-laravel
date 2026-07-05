<?php

namespace App\Jobs\Concerns;

/**
 * Mirrors queueFactory.js's CRITICAL_JOB_OPTS: 7 attempts, exponential backoff from
 * 3s. Used for payment/dispatch/settlement jobs — the ones Node gives a higher
 * retry budget than everything else.
 */
trait HasCriticalJobRetry
{
    public int $tries = 7;

    public function backoff(): array
    {
        return [3, 6, 12, 24, 48, 96, 192];
    }
}
