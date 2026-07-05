<?php

namespace App\Jobs\Concerns;

/** Mirrors queueFactory.js's DEFAULT_JOB_OPTS: 5 attempts, exponential backoff from 2s. */
trait HasDefaultJobRetry
{
    public int $tries = 5;

    public function backoff(): array
    {
        return [2, 4, 8, 16, 32];
    }
}
