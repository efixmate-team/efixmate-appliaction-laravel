<?php

namespace App\Http\Controllers;

use App\Support\PublicUrlResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of getBookingList() in server/src/modules/user/controller/user.controller.js. */
class CustomerBookingListController extends Controller
{
    private const STATUS_GROUPS = [
        'UPCOMING' => [1, 2, 20],
        'INPROGRESS' => [21, 22, 23],
        'COMPLETED' => [4],
        'CANCELLED' => [5],
    ];

    private const STATUS_NAMES = [
        1 => 'PENDING', 2 => 'CONFIRMED', 3 => 'IN PROGRESS', 4 => 'COMPLETED', 5 => 'CANCELLED',
        6 => 'FAILED', 7 => 'REFUNDED', 20 => 'BROADCASTED', 21 => 'TECH ACCEPTED', 22 => 'ON THE WAY',
        23 => 'ARRIVED', 24 => 'STARTED', 25 => 'NO SERVICE',
    ];

    private const PAYMENT_STATUS_NAMES = [30 => 'Pending', 31 => 'Paid', 32 => 'Failed', 33 => 'Refunded', 34 => 'Partial Refund'];

    /** GET /api/user/bookings */
    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(50, max(1, (int) $request->query('limit', 10)));
        $offset = ($page - 1) * $limit;
        $customerId = $request->user()->customer_id;

        $query = DB::table('efm_bookings as b')
            ->leftJoin('efm_mstr_services as srv', 'srv.service_id', '=', 'b.service_id')
            ->leftJoin('efm_customers as c', 'c.customer_id', '=', 'b.customer_id')
            ->leftJoin('efm_customer_address as a', 'a.address_id', '=', 'b.address_id')
            ->leftJoin('efm_mstr_areas as ar', 'ar.area_id', '=', 'b.area_id')
            ->where('b.customer_id', $customerId)
            ->where('b.is_deleted', false);

        $status = $request->query('status');
        if ($status) {
            $normalized = strtoupper(preg_replace('/[\s_\-]+/', '', $status));
            if (isset(self::STATUS_GROUPS[$normalized])) {
                $query->whereIn('b.booking_status_id', self::STATUS_GROUPS[$normalized]);
            } elseif (is_numeric($status)) {
                $query->where('b.booking_status_id', (int) $status);
            }
        }

        $search = $request->query('search');
        if ($search) {
            $query->where('srv.service', 'like', "%{$search}%");
        }

        $total = (clone $query)->count();

        $rows = $query->select(
            'b.*',
            'srv.service as service_name', 'srv.service_icon',
            'c.first_name', 'c.last_name', 'c.mobile_number',
            'a.city', 'a.state',
            'ar.area_name'
        )->orderByDesc('b.booking_id')->offset($offset)->limit($limit)->get();

        $data = $rows->map(function ($r) use ($request) {
            $statusText = self::STATUS_NAMES[(int) $r->booking_status_id] ?? 'UNKNOWN';
            $paymentStatusText = self::PAYMENT_STATUS_NAMES[(int) $r->payment_status_id] ?? 'Pending';

            $images = [];
            $snapshot = json_decode((string) $r->problem_description, true);
            if (is_array($snapshot)) {
                $lines = $snapshot['lines'] ?? (isset($snapshot[0]) ? $snapshot : []);
                foreach ((is_array($lines) ? $lines : []) as $line) {
                    foreach (($line['photos'] ?? []) as $photo) {
                        if ($photo && ! in_array($photo, $images, true)) {
                            $images[] = PublicUrlResolver::resolve($request, $photo);
                        }
                    }
                }
            }

            return [
                'booking_id' => $r->booking_id,
                'booking_number' => $r->booking_uid,
                'booking_uid' => $r->booking_uid,
                'service_name' => $r->service_name,
                'service' => $r->service_name,
                'service_icon' => PublicUrlResolver::resolve($request, $r->service_icon),
                'customer_name' => trim("{$r->first_name} {$r->last_name}"),
                'mobile_number' => $r->mobile_number,
                'scheduled_date' => $r->scheduled_date ? date('Y-m-d', strtotime($r->scheduled_date)) : null,
                'scheduled_time' => $r->scheduled_time,
                'booking_time' => $r->scheduled_time ? date('h:i A', strtotime($r->scheduled_time)) : null,
                'address' => trim(implode(', ', array_filter([$r->city, $r->state]))),
                'area_name' => $r->area_name,
                'amount' => (float) ($r->final_price ?? $r->base_price ?? 0),
                'final_price' => (float) ($r->final_price ?? $r->base_price ?? 0),
                'payment_status' => $paymentStatusText,
                'status' => (int) $r->booking_status_id,
                'status_text' => $statusText,
                'lifecycle_state' => strtoupper(str_replace(' ', '_', $statusText)),
                'image' => $images[0] ?? null,
                'images' => $images,
            ];
        });

        return response()->json(['status' => true, 'result' => [
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'count' => $data->count(),
                'per_page' => $limit,
                'current_page' => $page,
                'last_pages' => max(1, (int) ceil($total / $limit)),
            ],
        ]]);
    }
}
