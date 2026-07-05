<?php

namespace App\Services;

use Efixmate\Domain\Models\AdminFinancialYear;
use Illuminate\Support\Carbon;

/** Direct port of resolveFyIdForDate/getCurrentFinancialYear in server/src/services/adminScope.service.js. */
class FinancialYearService
{
    private static ?int $currentFyCache = null;

    private static ?int $currentFyCacheAt = null;

    /**
     * Node's resolveFyIdForDate() actually returns an inconsistent shape ({fy_id,
     * fy_label} on the primary match, a bare fy_id on the fallback) even though
     * every caller treats the result as a scalar id — normalized to always return
     * a plain fy_id here, matching the callers' real contract.
     */
    public function resolveFyIdForDate(?Carbon $date = null): ?int
    {
        $date ??= now();
        $dateStr = $date->copy()->utc()->toDateString();

        $fy = AdminFinancialYear::where('is_active', true)
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->first(['fy_id', 'fy_label']);

        if ($fy) {
            return $fy->fy_id;
        }

        return $this->getCurrentFinancialYear()?->fy_id;
    }

    public function getCurrentFinancialYear(): ?AdminFinancialYear
    {
        $now = now()->timestamp;
        if (self::$currentFyCache !== null && self::$currentFyCacheAt !== null && ($now - self::$currentFyCacheAt) < 60) {
            return AdminFinancialYear::find(self::$currentFyCache);
        }

        $fy = AdminFinancialYear::where('is_active', true)->where('is_current', true)->first();
        self::$currentFyCache = $fy?->fy_id;
        self::$currentFyCacheAt = $now;

        return $fy;
    }
}
