<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\TrackerMarketingSpend;
use Efixmate\Domain\Models\TrackingSession;
use Illuminate\Http\Request;

/** Direct port of server/.../admin/tracker.routes.js: marketing spend + live tracking sessions. */
class AdminTrackerController extends Controller
{
    /** GET /api/admin/tracker/marketing-spend */
    public function marketingSpend(Request $request)
    {
        $query = TrackerMarketingSpend::query();
        if ($request->filled('channel')) {
            $query->where('channel', $request->query('channel'));
        }

        return response()->json(['status' => true, 'data' => $query->orderByDesc('period_month')->get()]);
    }

    /** GET /api/admin/tracker/sessions */
    public function sessions()
    {
        $rows = TrackingSession::where('is_active', true)->orderByDesc('last_updated')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }
}
