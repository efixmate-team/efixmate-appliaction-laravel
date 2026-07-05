<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of server/src/modules/admin/controller/dashboard.controller.js. Node
 * scopes every query through getScopeFromRequest()/scopeBookingAfter() (country/state
 * /city/area/FY admin-scope preferences) — that data-scope-filtering system isn't built
 * in v1 yet (flagged in Stage 3), so every query here is unscoped/global for now; revisit
 * once admin scope preferences are ported.
 */
class AdminDashboardController extends Controller
{
    private const RANGE_DAYS = ['7d' => 7, '30d' => 30, '90d' => 90, 'year' => 365];

    private const STATUS_CASE_SQL = "CASE b.booking_status_id WHEN 1 THEN 'PENDING' WHEN 2 THEN 'CONFIRMED' WHEN 3 THEN 'IN PROGRESS' WHEN 4 THEN 'COMPLETED' WHEN 5 THEN 'CANCELLED' WHEN 6 THEN 'FAILED' WHEN 7 THEN 'REFUNDED' WHEN 20 THEN 'BROADCASTED' WHEN 21 THEN 'TECH ACCEPTED' WHEN 22 THEN 'ON THE WAY' WHEN 23 THEN 'ARRIVED' WHEN 24 THEN 'STARTED' WHEN 25 THEN 'NO SERVICE' ELSE 'UNKNOWN' END";

    private function parseRange(Request $request): array
    {
        $key = strtolower((string) $request->query('range', '7d'));
        $days = self::RANGE_DAYS[$key] ?? 7;

        return [isset(self::RANGE_DAYS[$key]) ? $key : '7d', $days];
    }

    private function calcTrend(float $current, float $prev): array
    {
        if ($prev === 0.0) {
            return $current === 0.0 ? ['change' => '0%', 'trend' => 'neutral'] : ['change' => '+100%', 'trend' => 'up'];
        }
        $pct = (($current - $prev) / $prev) * 100;
        $trend = $pct > 0 ? 'up' : ($pct < 0 ? 'down' : 'neutral');
        $sign = $pct > 0 ? '+' : '';

        return ['change' => $sign.number_format($pct, 1).'%', 'trend' => $trend];
    }

    private function formatChartLabel(string $day, int $days): string
    {
        $d = \Carbon\Carbon::parse($day.' 12:00:00');
        if ($days <= 7) {
            return $d->format('D');
        }
        if ($days <= 30) {
            return $d->format('j M');
        }

        return $d->format('M j');
    }

    private function fillDailySeries($rows, int $days, string $valueField): array
    {
        $byDay = [];
        foreach ($rows as $row) {
            $key = substr((string) $row->day, 0, 10);
            $byDay[$key] = (float) ($row->{$valueField} ?? 0);
        }

        $labels = [];
        $values = [];
        $today = now()->setTime(12, 0);
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = $today->copy()->subDays($i);
            $key = $d->toDateString();
            $labels[] = $this->formatChartLabel($key, $days);
            $values[] = $byDay[$key] ?? 0;
        }

        return ['labels' => $labels, 'values' => $values];
    }

    private function relativeTime($date): string
    {
        $then = \Carbon\Carbon::parse($date);
        $mins = $then->diffInMinutes(now());
        if ($mins < 1) {
            return 'Just now';
        }
        if ($mins < 60) {
            return "{$mins}m ago";
        }
        $hrs = intdiv($mins, 60);
        if ($hrs < 24) {
            return "{$hrs}h ago";
        }
        $days = intdiv($hrs, 24);
        if ($days < 7) {
            return "{$days}d ago";
        }

        return $then->format('j M');
    }

    /** GET /api/admin/dashboard/stats */
    public function stats(Request $request)
    {
        [$rangeKey, $days] = $this->parseRange($request);

        $revenueCurrent = (float) DB::table('efm_bookings')->where('is_active', true)->where('booking_status_id', 4)
            ->where('updated_at', '>=', now()->subDays($days))
            ->sum(DB::raw('COALESCE(final_price, estimated_price, 0)'));

        $revenuePrev = (float) DB::table('efm_bookings')->where('is_active', true)->where('booking_status_id', 4)
            ->whereBetween('updated_at', [now()->subDays($days * 2), now()->subDays($days)])
            ->sum(DB::raw('COALESCE(final_price, estimated_price, 0)'));

        $bookingsCurrent = DB::table('efm_bookings')->where('is_active', true)->where('created_at', '>=', now()->subDays($days))->count();
        $bookingsPrev = DB::table('efm_bookings')->where('is_active', true)
            ->whereBetween('created_at', [now()->subDays($days * 2), now()->subDays($days)])->count();

        $techniciansTotal = DB::table('efm_technicians')->where('is_active', true)->distinct('technician_id')->count('technician_id');
        $newTech = DB::table('efm_technicians')->where('is_active', true)->where('created_at', '>=', now()->subDays($days))->count();

        $customersTotal = DB::table('efm_customers as c')->where('c.is_active', true)
            ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('efm_bookings as b')->whereColumn('b.customer_id', 'c.customer_id')->where('b.is_active', true))
            ->count();
        $newCustomers = DB::table('efm_customers as c')->where('c.is_active', true)->where('c.created_at', '>=', now()->subDays($days))
            ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('efm_bookings as b')->whereColumn('b.customer_id', 'c.customer_id')->where('b.is_active', true))
            ->count();

        $chartBookings = DB::table('efm_bookings')->where('is_active', true)->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')->groupBy('day')->orderBy('day')->get();
        $chartRevenue = DB::table('efm_bookings')->where('is_active', true)->where('booking_status_id', 4)->where('updated_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(updated_at) as day, COALESCE(SUM(COALESCE(final_price, estimated_price, 0)),0) as revenue')->groupBy('day')->orderBy('day')->get();

        $statusBreakdown = DB::table('efm_bookings as b')->where('b.is_active', true)->where('b.created_at', '>=', now()->subDays($days))
            ->selectRaw(self::STATUS_CASE_SQL.' as status, COUNT(*) as count')->groupBy('b.booking_status_id')->orderByDesc('count')->get();

        $pendingApplications = DB::table('efm_technicians')->whereRaw('LOWER(COALESCE(application_status, \'\')) = ?', ['pending'])->count();
        $delayedBookings = DB::table('efm_bookings')->where('is_active', true)->whereNotNull('scheduled_date')
            ->where('scheduled_date', '<', now())->whereNotIn('booking_status_id', [4, 5])->count();
        $todayBookings = DB::table('efm_bookings')->where('is_active', true)->whereDate('created_at', now()->toDateString())->count();

        $totalRevenueAll = (float) DB::table('efm_bookings')->where('is_active', true)->where('booking_status_id', 4)
            ->sum(DB::raw('COALESCE(final_price, estimated_price, 0)'));

        $bookingsChart = $this->fillDailySeries($chartBookings, $days, 'count');
        $revenueChart = $this->fillDailySeries($chartRevenue, $days, 'revenue');

        return response()->json(['status' => true, 'data' => [
            'range' => $rangeKey, 'periodDays' => $days,
            'kpis' => [
                'revenue' => array_merge(['value' => number_format($revenueCurrent, 2, '.', ''), 'totalAllTime' => number_format($totalRevenueAll, 2, '.', '')], $this->calcTrend($revenueCurrent, $revenuePrev)),
                'bookings' => array_merge(['value' => $bookingsCurrent], $this->calcTrend($bookingsCurrent, $bookingsPrev)),
                'technicians' => ['value' => $techniciansTotal, 'newInPeriod' => $newTech],
                'customers' => ['value' => $customersTotal, 'newInPeriod' => $newCustomers],
            ],
            'chart' => ['labels' => $bookingsChart['labels'], 'bookings' => $bookingsChart['values'], 'revenue' => $revenueChart['values']],
            'statusBreakdown' => $statusBreakdown->map(fn ($r) => ['status' => $r->status, 'count' => $r->count]),
            'alerts' => ['pendingApplications' => $pendingApplications, 'delayedBookings' => $delayedBookings, 'todayBookings' => $todayBookings],
        ]]);
    }

    /** GET /api/admin/dashboard/recent-bookings */
    public function recentBookings(Request $request)
    {
        $limit = min((int) $request->query('limit', 8), 20);

        $rows = DB::table('efm_bookings as b')
            ->leftJoin('efm_customers as c', 'b.customer_id', '=', 'c.customer_id')
            ->leftJoin('efm_mstr_services as ms', 'b.service_id', '=', 'ms.service_id')
            ->where('b.is_active', true)
            ->selectRaw("b.booking_id, b.booking_uid, b.final_price, b.estimated_price, b.created_at, b.scheduled_date,
                COALESCE(NULLIF(TRIM(CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.last_name,''))), ''), 'Unknown Customer') as customer_name,
                COALESCE(ms.service, '—') as service_name,".self::STATUS_CASE_SQL.' as booking_status')
            ->orderByDesc('b.created_at')->limit($limit)->get();

        return response()->json(['status' => true, 'data' => $rows->map(fn ($r) => [
            'id' => $r->booking_uid ?: "#{$r->booking_id}",
            'bookingId' => $r->booking_id, 'customer' => $r->customer_name, 'service' => $r->service_name,
            'amount' => $r->final_price ?? $r->estimated_price ?? 0, 'status' => $r->booking_status,
            'date' => \Carbon\Carbon::parse($r->created_at)->format('d M Y, g:i A'), 'createdAt' => $r->created_at,
        ])]);
    }

    /** GET /api/admin/dashboard/top-services */
    public function topServices(Request $request)
    {
        [, $days] = $this->parseRange($request);
        $limit = min((int) $request->query('limit', 5), 10);

        $rows = DB::table('efm_mstr_services as ms')
            ->join('efm_bookings as b', 'ms.service_id', '=', 'b.service_id')
            ->where('b.is_active', true)->where('b.created_at', '>=', now()->subDays($days))
            ->selectRaw('ms.service as name, COUNT(b.booking_id) as sales, COALESCE(SUM(COALESCE(b.final_price, b.estimated_price, 0)),0) as revenue')
            ->groupBy('ms.service')->orderByDesc('sales')->limit($limit)->get();

        $maxSales = $rows->isNotEmpty() ? (int) $rows->first()->sales : 1;

        return response()->json(['status' => true, 'data' => $rows->map(fn ($r) => [
            'name' => $r->name, 'sales' => (int) $r->sales, 'revenue' => number_format((float) $r->revenue, 2, '.', ''),
            'pct' => $maxSales > 0 ? (int) round(((int) $r->sales / $maxSales) * 100) : 0,
        ])]);
    }

    /** GET /api/admin/dashboard/activity */
    public function activity(Request $request)
    {
        $limit = min((int) $request->query('limit', 8), 20);

        $bookingActivity = DB::table('efm_bookings as b')
            ->leftJoin('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
            ->leftJoin('efm_mstr_services as ms', 'ms.service_id', '=', 'b.service_id')
            ->where('b.is_active', true)
            ->selectRaw("'booking' as kind, b.booking_uid as ref, 'New booking' as title,
                CONCAT(COALESCE(ms.service, 'Service request'), ' · ',
                    COALESCE(NULLIF(TRIM(CONCAT(COALESCE(c.first_name,''), ' ', COALESCE(c.last_name,''))), ''), 'Customer')) as subtitle,
                b.created_at as occurred_at");

        $techActivity = DB::table('efm_technicians as t')
            ->leftJoinSub(
                DB::table('efm_technician_location')->select('technician_id', 'city', DB::raw('ROW_NUMBER() OVER (PARTITION BY technician_id ORDER BY location_id DESC) as rn'))->where('is_active', true),
                'tl', function ($j) { $j->on('tl.technician_id', '=', 't.technician_id')->where('tl.rn', 1); }
            )
            ->whereRaw('LOWER(COALESCE(t.application_status, \'\')) = ?', ['pending'])
            ->selectRaw("'application' as kind, CONCAT('TECH-', t.technician_id) as ref, 'Application pending review' as title,
                CONCAT(COALESCE(NULLIF(TRIM(CONCAT(COALESCE(t.first_name,''), ' ', COALESCE(t.last_name,''))), ''), 'Technician'),
                    COALESCE(CONCAT(' · ', NULLIF(TRIM(tl.city), '')), '')) as subtitle,
                COALESCE(t.updated_at, t.created_at) as occurred_at");

        $rows = $bookingActivity->unionAll($techActivity)
            ->orderByDesc('occurred_at')->limit($limit)->get();

        return response()->json(['status' => true, 'data' => $rows->map(fn ($r) => [
            'kind' => $r->kind, 'ref' => $r->ref, 'title' => $r->title, 'subtitle' => $r->subtitle,
            'timeAgo' => $this->relativeTime($r->occurred_at),
        ])]);
    }
}
