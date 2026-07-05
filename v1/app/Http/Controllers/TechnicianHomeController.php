<?php

namespace App\Http\Controllers;

use App\Services\TechnicianRegistrationService;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingStatusLog;
use Efixmate\Domain\Models\BookingTechnician;
use Efixmate\Domain\Models\DispatchJobOffer;
use Efixmate\Domain\Models\LogTechnicianAssignment;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianWalletLedger;
use Efixmate\Domain\Models\TechnicianWithdrawRequest;
use Efixmate\Domain\Support\BookingStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of server/.../technicianHome.controller.js. */
class TechnicianHomeController extends Controller
{
    public function __construct(private TechnicianRegistrationService $registrationSvc) {}

    private const JOB_SELECT = [
        'b.booking_id', 'b.booking_uid', 'b.scheduled_date', 'b.scheduled_time', 'b.final_price', 'b.estimated_price',
        'b.unit_price', 'b.quantity', 'b.completed_at', 'b.booking_status_id',
        's.service as service_name', 's.service_icon', 's.service_color', 'sc.category_name',
        'c.first_name as customer_first_name', 'c.last_name as customer_last_name',
        'ca.address as customer_address', 'ca.city as address_city', 'ar.area_name',
    ];

    private function jobQuery()
    {
        return DB::table('efm_bookings as b')
            ->join('efm_mstr_services as s', 's.service_id', '=', 'b.service_id')
            ->join('efm_mstr_service_category as sc', 'sc.category_id', '=', 'b.service_category_id')
            ->join('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
            ->join('efm_customer_address as ca', 'ca.address_id', '=', 'b.address_id')
            ->leftJoin('efm_mstr_areas as ar', 'ar.area_id', '=', 'b.area_id');
    }

    private function formatScheduledLabel($date, $time): string
    {
        if (! $date) {
            return '';
        }
        $d = \Carbon\Carbon::parse($date);
        $label = $d->isToday() ? 'Today' : $d->format('j M');

        return trim($label.' '.($time ?? ''));
    }

    private function mapJobCard($row, ?int $offerId = null, ?string $expiresAt = null, string $status = 'new'): array
    {
        $price = $row->final_price ?? $row->estimated_price ?? ((float) $row->unit_price * ($row->quantity ?: 1));
        $locationLabel = trim(implode(', ', array_filter([$row->area_name, $row->address_city ?? null]))) ?: ($row->customer_address ?? '—');
        $customerName = trim(implode(' ', array_filter([$row->customer_first_name, $row->customer_last_name]))) ?: 'Customer';

        return [
            'booking_id' => $row->booking_id, 'booking_uid' => $row->booking_uid,
            'offer_id' => $offerId, 'status' => $status,
            'service_name' => $row->service_name ?: ($row->category_name ?: 'Service'),
            'service_icon' => $row->service_icon, 'service_color' => $row->service_color, 'category_name' => $row->category_name,
            'customer_name' => $customerName,
            'scheduled_label' => $this->formatScheduledLabel($row->scheduled_date, $row->scheduled_time),
            'location_label' => $locationLabel, 'amount' => (float) $price, 'expires_at' => $expiresAt,
        ];
    }

    private function loadApproved(Request $request): Technician
    {
        $technicianId = $request->user()->technician_id;
        $technician = Technician::find($technicianId);
        abort_if(! $technician, 404, 'Technician not found');
        abort_if(! $technician->is_active, 403, 'Account is not approved yet');

        return $technician;
    }

    /** GET /api/technician/home/dashboard */
    public function dashboard(Request $request)
    {
        $t = $this->loadApproved($request);
        $id = $t->technician_id;

        $todayEarnings = (float) TechnicianWalletLedger::where('technician_id', $id)->where('entry_type', 'CREDIT')->whereDate('created_at', now())->sum('amount');
        $todayOrders = Booking::where('technician_id', $id)->where('booking_status_id', BookingStatus::COMPLETED)->where('is_deleted', false)->whereDate('completed_at', now())->count();
        $totalOrders = Booking::where('technician_id', $id)->where('booking_status_id', BookingStatus::COMPLETED)->where('is_deleted', false)->count();

        $offers = [];
        if ($t->is_online) {
            $offers = DB::table('efm_dispatch_job_offers as o')
                ->join('efm_bookings as b', 'b.booking_id', '=', 'o.booking_id')
                ->join('efm_mstr_services as s', 's.service_id', '=', 'b.service_id')
                ->join('efm_mstr_service_category as sc', 'sc.category_id', '=', 'b.service_category_id')
                ->join('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
                ->join('efm_customer_address as ca', 'ca.address_id', '=', 'b.address_id')
                ->leftJoin('efm_mstr_areas as ar', 'ar.area_id', '=', 'b.area_id')
                ->where('o.technician_id', $id)->where('o.status', 'pending')->where('o.expires_at', '>', now())
                ->whereNull('b.technician_id')->where('b.booking_status_id', BookingStatus::BROADCASTED)
                ->orderByDesc('o.created_at')->limit(20)
                ->select(array_merge(['o.offer_id', 'o.expires_at', 'o.created_at'], self::JOB_SELECT))
                ->get();
        }

        $completedToday = $this->jobQuery()->where('b.technician_id', $id)->where('b.booking_status_id', BookingStatus::COMPLETED)
            ->whereDate('b.completed_at', now())->orderByDesc('b.completed_at')->limit(10)->select(self::JOB_SELECT)->get();

        $unreadCount = DispatchJobOffer::where('technician_id', $id)->where('status', 'pending')->where('expires_at', '>', now())->count();

        $incentiveTarget = (int) env('TECHNICIAN_INCENTIVE_JOBS_TARGET', 5);
        $incentiveReward = (int) env('TECHNICIAN_INCENTIVE_REWARD', 500);
        $modulo = $incentiveTarget > 0 ? $todayOrders % $incentiveTarget : 0;
        $jobsTowardBonus = $modulo;
        $jobsRemaining = ($modulo === 0 && $todayOrders > 0) ? $incentiveTarget : $incentiveTarget - $modulo;

        $location = $this->registrationSvc->getActiveLocation($id);
        $locationLabel = $location ? (trim(implode(', ', array_filter([$location->city, $location->state]))) ?: ($location->address ?: '—')) : '—';

        return response()->json(['status' => true, 'data' => [
            'header' => [
                'first_name' => $t->first_name, 'last_name' => $t->last_name,
                'profile_photo_url' => PublicUrlResolver::resolve($request, $t->profile_pitcher ?: $t->selfie_photo),
                'location_label' => $locationLabel, 'unread_notifications' => $unreadCount, 'technician_unique_id' => $t->technician_unique_id,
            ],
            'availability' => ['is_online' => (bool) $t->is_online, 'label' => $t->is_online ? "You're Online" : "You're Offline", 'subtitle' => $t->is_online ? 'Turn on to receive new job offers' : 'You will not receive new job offers'],
            'earnings' => ['today_total' => $todayEarnings, 'currency' => 'INR'],
            'stats' => ['today_orders' => $todayOrders, 'total_orders' => $totalOrders, 'reviews_count' => $totalOrders, 'rating' => 4.8],
            'incentive' => ['label' => "Complete {$jobsRemaining} more job".($jobsRemaining === 1 ? '' : 's')." and get ₹{$incentiveReward} bonus", 'current' => $jobsTowardBonus, 'target' => $incentiveTarget, 'reward_amount' => $incentiveReward],
            'service_requests' => collect($offers)->map(fn ($r) => $this->mapJobCard($r, $r->offer_id, $r->expires_at))->values(),
            'todays_completed_jobs' => $completedToday->map(fn ($r) => $this->mapJobCard($r, null, null, 'completed'))->values(),
        ]]);
    }

    /** PATCH /api/technician/home/availability */
    public function setAvailability(Request $request)
    {
        $t = $this->loadApproved($request);
        $isOnline = $request->input('isOnline') ?? $request->input('is_online') ?? $request->input('online') ?? $request->input('available');
        abort_if(! is_bool($isOnline), 400, 'isOnline (boolean) is required');

        Technician::where('technician_id', $t->technician_id)->update(['is_online' => $isOnline, 'updated_by' => 'technician', 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => $isOnline ? 'You are now online' : 'You are now offline', 'data' => [
            'is_online' => $isOnline, 'label' => $isOnline ? "You're Online" : "You're Offline",
            'subtitle' => $isOnline ? "You'll start receiving new job offers" : 'You will not receive new job offers',
        ]]);
    }

    /** GET /api/technician/home/jobs/{bookingId} */
    public function jobDetail(Request $request, int $bookingId)
    {
        $t = $this->loadApproved($request);

        $row = $this->jobQuery()
            ->leftJoin('efm_dispatch_job_offers as o', function ($j) use ($t) {
                $j->on('o.booking_id', '=', 'b.booking_id')->where('o.technician_id', $t->technician_id);
            })
            ->where('b.booking_id', $bookingId)
            ->where(function ($q) use ($t) {
                $q->where('b.technician_id', $t->technician_id)
                    ->orWhere(function ($qq) { $qq->where('o.status', 'pending')->where('o.expires_at', '>', now()); });
            })
            ->select(array_merge(self::JOB_SELECT, ['o.status as offer_status']))
            ->first();
        abort_if(! $row, 404, 'Job not found');

        $review = null;
        if ((int) $row->booking_status_id === BookingStatus::COMPLETED) {
            $review = DB::table('efm_service_reviews')->where('booking_id', $bookingId)->where('is_active', true)
                ->select('rating', 'comment', 'created_at')->first();
        }

        $booking = Booking::find($bookingId);

        return response()->json(['status' => true, 'data' => array_merge($this->mapJobCard($row), [
            'problem_description' => $booking?->problem_description, 'booking_status_id' => $row->booking_status_id,
            'offer_status' => $row->offer_status, 'payment_status_id' => $booking?->payment_status_id,
            'assigned_at' => $booking?->assigned_at, 'started_at' => $booking?->started_at, 'completed_at' => $booking?->completed_at,
            'customer_review' => $review,
        ])]);
    }

    /** POST /api/technician/home/jobs/skip */
    public function skipJob(Request $request)
    {
        $t = $this->loadApproved($request);
        $bookingId = (int) ($request->input('bookingId') ?? $request->input('booking_id'));
        abort_if(! $bookingId, 400, 'bookingId is required');

        $offer = DB::table('efm_dispatch_job_offers as o')->join('efm_bookings as b', 'b.booking_id', '=', 'o.booking_id')
            ->where('o.booking_id', $bookingId)->where('o.technician_id', $t->technician_id)->where('o.status', 'pending')
            ->select('o.offer_id', 'b.booking_status_id', 'b.technician_id')->first();
        abort_if(! $offer, 404, 'No pending offer for this job');

        DispatchJobOffer::where('booking_id', $bookingId)->where('technician_id', $t->technician_id)->where('status', 'pending')->update(['status' => 'declined']);

        LogTechnicianAssignment::create([
            'booking_id' => $bookingId, 'technician_id' => $t->technician_id, 'type' => 'DISPATCH', 'attempt_no' => 1,
            'action' => 'SKIP', 'reason' => $request->input('reason', 'Skipped by technician'), 'payload' => ['source' => 'technician_app'], 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Job skipped']);
    }

    /** POST /api/technician/home/jobs/accept */
    public function acceptJob(Request $request)
    {
        $t = $this->loadApproved($request);
        $bookingId = (int) ($request->input('bookingId') ?? $request->input('booking_id'));
        abort_if(! $bookingId, 400, 'bookingId is required');

        return DB::transaction(function () use ($t, $bookingId) {
            $offer = DB::table('efm_dispatch_job_offers as o')->join('efm_bookings as b', 'b.booking_id', '=', 'o.booking_id')
                ->where('o.booking_id', $bookingId)->where('o.technician_id', $t->technician_id)->where('o.status', 'pending')->where('o.expires_at', '>', now())
                ->select('o.offer_id', 'b.technician_id as booking_technician_id')->lockForUpdate()->first();
            abort_if(! $offer, 404, 'Offer expired or not found');
            abort_if($offer->booking_technician_id && (int) $offer->booking_technician_id !== $t->technician_id, 409, 'Job already assigned to another technician');

            DispatchJobOffer::where('booking_id', $bookingId)->where('technician_id', $t->technician_id)->where('status', 'pending')->update(['status' => 'accepted']);
            DispatchJobOffer::where('booking_id', $bookingId)->where('status', 'pending')->where('technician_id', '!=', $t->technician_id)->update(['status' => 'superseded']);

            Booking::where('booking_id', $bookingId)->update(['technician_id' => $t->technician_id, 'booking_status_id' => BookingStatus::TECH_ACCEPTED, 'assigned_at' => now(), 'updated_by' => 'technician', 'updated_at' => now()]);

            $existingAssignment = BookingTechnician::where('booking_id', $bookingId)->where('technician_id', $t->technician_id)->where('is_active', true)->exists();
            if (! $existingAssignment) {
                BookingTechnician::create(['technician_id' => $t->technician_id, 'booking_id' => $bookingId, 'assigned_at' => now(), 'is_active' => true, 'created_by' => 'technician', 'created_at' => now()]);
            }

            Technician::where('technician_id', $t->technician_id)->increment('current_jobs');

            BookingStatusLog::create(['booking_id' => $bookingId, 'old_status' => null, 'new_status' => BookingStatus::TECH_ACCEPTED, 'changed_by' => (string) $t->technician_id, 'remark' => 'Job accepted', 'created_at' => now()]);

            return response()->json(['status' => true, 'message' => 'Job accepted successfully', 'data' => ['booking_id' => $bookingId, 'booking_status_id' => BookingStatus::TECH_ACCEPTED]]);
        });
    }

    private const STATUS_ID_MAP = ['ON_THE_WAY' => 22, 'ARRIVED' => 23, 'STARTED' => 24, 'COMPLETED' => 4];

    /** PATCH /api/technician/home/jobs/{bookingId}/status */
    public function updateJobStatus(Request $request, int $bookingId)
    {
        $t = $this->loadApproved($request);
        $status = strtoupper((string) $request->input('status'));
        abort_if(! isset(self::STATUS_ID_MAP[$status]), 400, 'Invalid status. Allowed: ON_THE_WAY, ARRIVED, STARTED, COMPLETED');
        $newStatusId = self::STATUS_ID_MAP[$status];

        return DB::transaction(function () use ($t, $bookingId, $status, $newStatusId) {
            $booking = Booking::where('booking_id', $bookingId)->where('technician_id', $t->technician_id)->lockForUpdate()->first();
            abort_if(! $booking, 404, 'Job not found or not assigned to you');

            $updates = ['booking_status_id' => $newStatusId, 'updated_by' => 'technician', 'updated_at' => now()];
            if ($status === 'STARTED') {
                $updates['started_at'] = now();
            } elseif ($status === 'COMPLETED') {
                $updates['completed_at'] = now();
            }
            $booking->update($updates);

            if ($status === 'COMPLETED') {
                Technician::where('technician_id', $t->technician_id)->update(['current_jobs' => DB::raw('GREATEST(0, current_jobs - 1)'), 'updated_at' => now()]);

                $referrals = app(\App\Services\ReferralService::class);
                if ($booking->customer_id) {
                    $referrals->creditReferralReward($bookingId, $booking->customer_id);
                }
                $referrals->creditTechReferralReward($t->technician_id, $bookingId);
            }

            BookingStatusLog::create([
                'booking_id' => $bookingId, 'old_status' => null, 'new_status' => $newStatusId, 'changed_by' => (string) $t->technician_id,
                'remark' => 'Status updated to '.$status.' by technician', 'created_at' => now(),
            ]);

            return response()->json(['status' => true, 'message' => 'Job status updated to '.strtolower(str_replace('_', ' ', $status)), 'data' => ['booking_id' => $bookingId, 'booking_status_id' => $newStatusId]]);
        });
    }

    /** POST /api/technician/home/device/register */
    public function registerDevice(Request $request)
    {
        $t = $this->loadApproved($request);
        $token = $request->input('fcm_token') ?? $request->input('fcmToken');
        abort_if(! $token, 400, 'fcm_token is required');

        Technician::where('technician_id', $t->technician_id)->update(['fcm_token' => substr((string) $token, 0, 512), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Device registered for push notifications']);
    }

    /** POST /api/technician/home/location/update + PATCH /home/location */
    public function updateLocation(Request $request)
    {
        $t = $this->loadApproved($request);
        $lat = $request->input('lat') ?? $request->input('latitude');
        $lng = $request->input('lng') ?? $request->input('longitude');
        abort_if(! is_numeric($lat) || ! is_numeric($lng), 400, 'lat and lng are required');

        DB::table('efm_technician_live_locations')->updateOrInsert(
            ['technician_id' => $t->technician_id],
            ['lat' => $lat, 'lng' => $lng, 'updated_at' => now()]
        );

        return response()->json(['status' => true, 'message' => 'Location updated']);
    }

    /** POST /api/technician/home/address + PATCH /home/address */
    public function upsertAddress(Request $request)
    {
        $t = $this->loadApproved($request);
        $body = $request->all();
        abort_if(empty($body['address']) || empty($body['city']) || empty($body['state']) || empty($body['country']) || empty($body['pincode']), 400, 'address, city, state, country, and pincode are required');

        $pincode = (int) $body['pincode'];
        abort_if(! $pincode, 400, 'Invalid pincode');

        [$lat, $lng] = $this->registrationSvc->pickOptionalCoordinates($body);
        abort_if($lat === null || $lng === null, 400, 'latitude and longitude are required');

        $existing = DB::table('efm_technician_location')->where('technician_id', $t->technician_id)->where('is_active', true)->orderByDesc('location_id')->first();
        if ($existing) {
            DB::table('efm_technician_location')->where('location_id', $existing->location_id)->update([
                'city' => $body['city'], 'state' => $body['state'], 'country' => $body['country'], 'address' => $body['address'],
                'pincode' => $pincode, 'latitude' => (string) $lat, 'longitude' => (string) $lng, 'updated_by' => 'technician', 'updated_at' => now(),
            ]);
            $row = DB::table('efm_technician_location')->where('location_id', $existing->location_id)->first();
        } else {
            $id = DB::table('efm_technician_location')->insertGetId([
                'technician_id' => $t->technician_id, 'city' => $body['city'], 'state' => $body['state'], 'country' => $body['country'],
                'address' => $body['address'], 'pincode' => $pincode, 'latitude' => (string) $lat, 'longitude' => (string) $lng,
                'status_id' => 1, 'is_active' => true, 'created_by' => 'technician', 'created_at' => now(),
            ], 'location_id');
            $row = DB::table('efm_technician_location')->where('location_id', $id)->first();
        }

        return response()->json(['status' => true, 'message' => 'Address saved successfully', 'data' => $row]);
    }

    /** GET /api/technician/home/my-jobs */
    public function myJobs(Request $request)
    {
        $t = $this->loadApproved($request);
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(50, max(1, (int) $request->query('limit', 15)));
        $status = $request->query('status', 'all');

        $base = DB::table('efm_bookings as b')->where('b.technician_id', $t->technician_id);
        $countQuery = (clone $base)->where('b.is_deleted', false);
        match ($status) {
            'completed' => $countQuery->where('b.booking_status_id', 4),
            'active' => $countQuery->whereNotIn('b.booking_status_id', [4, 5, 6]),
            'pending' => $countQuery->whereIn('b.booking_status_id', [1, 2, 3]),
            default => null,
        };
        $total = $countQuery->count();

        $rowsQuery = DB::table('efm_bookings as b')
            ->leftJoin('efm_mstr_services as srv', 'srv.service_id', '=', 'b.service_id')
            ->leftJoin('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
            ->where('b.technician_id', $t->technician_id);
        match ($status) {
            'completed' => $rowsQuery->where('b.booking_status_id', 4),
            'active' => $rowsQuery->whereNotIn('b.booking_status_id', [4, 5, 6]),
            'pending' => $rowsQuery->whereIn('b.booking_status_id', [1, 2, 3]),
            default => null,
        };

        $rows = $rowsQuery->orderByDesc('b.created_at')->limit($limit)->offset(($page - 1) * $limit)
            ->selectRaw("b.booking_id, b.booking_uid,
                CASE b.booking_status_id WHEN 1 THEN 'PENDING' WHEN 2 THEN 'CONFIRMED' WHEN 3 THEN 'IN PROGRESS' WHEN 4 THEN 'COMPLETED' WHEN 5 THEN 'CANCELLED' WHEN 6 THEN 'FAILED' WHEN 7 THEN 'REFUNDED' WHEN 20 THEN 'BROADCASTED' WHEN 21 THEN 'TECH ACCEPTED' WHEN 22 THEN 'ON THE WAY' WHEN 23 THEN 'ARRIVED' WHEN 24 THEN 'STARTED' WHEN 25 THEN 'NO SERVICE' ELSE 'UNKNOWN' END as status_name,
                srv.service as service_name, CONCAT(c.first_name, ' ', c.last_name) as customer_name,
                b.scheduled_date, b.final_price, b.completed_at")
            ->get();

        return response()->json(['status' => true, 'data' => ['rows' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]]);
    }

    /** GET /api/technician/home/my-earnings */
    public function myEarnings(Request $request)
    {
        $t = $this->loadApproved($request);
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(50, max(1, (int) $request->query('limit', 20)));

        $totalEarned = (float) TechnicianWalletLedger::where('technician_id', $t->technician_id)->where('entry_type', 'CREDIT')->sum('amount');
        $thisMonth = (float) TechnicianWalletLedger::where('technician_id', $t->technician_id)->where('entry_type', 'CREDIT')
            ->whereRaw('DATE_FORMAT(created_at, "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")')->sum('amount');
        $totalDebited = (float) TechnicianWalletLedger::where('technician_id', $t->technician_id)->where('entry_type', 'DEBIT')->sum('amount');
        $walletBalance = (float) (TechnicianWalletLedger::where('technician_id', $t->technician_id)->orderByDesc('created_at')->value('balance_after') ?? 0);

        $payoutAgg = DB::table('efm_payouts')->where('technician_id', $t->technician_id)->where('status', 'PAID')
            ->selectRaw('COALESCE(SUM(amount),0) as total_paid_out, COUNT(*) as payout_count')->first();

        $total = TechnicianWalletLedger::where('technician_id', $t->technician_id)->count();
        $rows = TechnicianWalletLedger::where('technician_id', $t->technician_id)->orderByDesc('created_at')
            ->limit($limit)->offset(($page - 1) * $limit)
            ->get(['ledger_id', 'entry_type', 'amount', 'balance_after', 'booking_id', 'created_at']);

        return response()->json(['status' => true, 'data' => [
            'stats' => [
                'total_earned' => $totalEarned, 'this_month' => $thisMonth, 'total_debited' => $totalDebited, 'wallet_balance' => $walletBalance,
                'total_paid_out' => (float) $payoutAgg->total_paid_out, 'payout_count' => (int) $payoutAgg->payout_count,
            ],
            'rows' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit,
        ]]);
    }

    /** POST /api/technician/home/withdraw-request */
    public function requestWithdrawal(Request $request)
    {
        $t = $this->loadApproved($request);
        $amount = (float) $request->input('amount');
        abort_if($amount <= 0, 400, 'Invalid amount');

        $walletBalance = (float) (TechnicianWalletLedger::where('technician_id', $t->technician_id)->orderByDesc('created_at')->value('balance_after') ?? 0);
        abort_if($amount > $walletBalance, 422, 'Insufficient wallet balance');

        $pending = TechnicianWithdrawRequest::where('technician_id', $t->technician_id)->where('status', 'pending')->exists();
        abort_if($pending, 409, 'A withdrawal request is already pending. Please wait for it to be processed.');

        TechnicianWithdrawRequest::create(['technician_id' => $t->technician_id, 'amount' => $amount, 'status' => 'pending', 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Withdrawal request submitted. Admin will process it within 2-3 business days.'], 201);
    }

    /** GET /api/technician/home/notifications/unread-count */
    public function unreadNotifications(Request $request)
    {
        $t = $this->loadApproved($request);
        $count = DispatchJobOffer::where('technician_id', $t->technician_id)->where('status', 'pending')->where('expires_at', '>', now())->count();

        return response()->json(['status' => true, 'data' => ['unread_count' => $count]]);
    }
}
