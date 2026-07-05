<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AnalyticsEvent;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of the read-only analytics cluster in server/.../admin/analytics.routes.js. */
class AdminAnalyticsController extends Controller
{
    /** GET /api/admin/analytics/overview */
    public function overview()
    {
        return response()->json(['status' => true, 'data' => [
            'total_customers' => Customer::count(),
            'total_bookings' => Booking::count(),
            'completed_bookings' => Booking::where('booking_status_id', 4)->count(),
            'cancelled_bookings' => Booking::where('booking_status_id', 5)->count(),
        ]]);
    }

    /** GET /api/admin/analytics/bookings-trend */
    public function bookingsTrend(Request $request)
    {
        $days = min(90, (int) $request->query('days', 30));
        $rows = DB::table('efm_bookings')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('day')->orderBy('day')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/analytics/revenue-trend */
    public function revenueTrend(Request $request)
    {
        $days = min(90, (int) $request->query('days', 30));
        $rows = DB::table('efm_bookings')
            ->selectRaw('DATE(created_at) as day, SUM(COALESCE(final_price, estimated_price, 0)) as revenue')
            ->where('created_at', '>=', now()->subDays($days))
            ->where('payment_status_id', 2)
            ->groupBy('day')->orderBy('day')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** GET /api/admin/analytics/events */
    public function events(Request $request)
    {
        $limit = min(200, (int) $request->query('limit', 50));
        $query = AnalyticsEvent::query();
        if ($request->filled('event_name')) {
            $query->where('event_name', $request->query('event_name'));
        }

        return response()->json(['status' => true, 'data' => $query->orderByDesc('created_at')->limit($limit)->get()]);
    }

    /** POST /api/admin/analytics/events */
    public function trackEvent(Request $request)
    {
        $data = $request->validate([
            'event_name' => ['required', 'string'],
            'entity_type' => ['nullable', 'string'],
            'entity_id' => ['nullable', 'integer'],
            'payload' => ['nullable', 'array'],
        ]);
        $event = AnalyticsEvent::create(array_merge($data, ['created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Event recorded', 'data' => $event], 201);
    }
}
