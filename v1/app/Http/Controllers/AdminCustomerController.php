<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use Efixmate\Domain\Models\ActivityLog;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\CustomerAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Direct port of the customer-management cluster in
 * server/src/modules/admin/routes/admin.routes.js: paginated list, CRUD,
 * block/unblock ("verify"), bookings, addresses, activity-logs.
 */
class AdminCustomerController extends Controller
{
    /** POST /api/admin/users/paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = (int) $request->input('limit', 10);
        $search = $request->input('search');

        $query = Customer::query();
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('mobile_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('is_blocked')) {
            $query->where('is_blocked', filter_var($request->input('is_blocked'), FILTER_VALIDATE_BOOLEAN));
        }

        $total = (clone $query)->count();
        $data = $query->orderByDesc('customer_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'message' => 'Customers fetched', 'data' => ApiResponseFilter::filter($data->toArray(), 'customer_id'),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/users/{id} */
    public function show(int $id)
    {
        $customer = Customer::findOrFail($id);
        $addresses = CustomerAddress::where('customer_id', $id)->get();
        $bookingStats = Booking::where('customer_id', $id)
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN booking_status_id = 4 THEN 1 ELSE 0 END) as completed')
            ->first();

        return response()->json(['status' => true, 'data' => [
            'customer' => $customer, 'addresses' => $addresses,
            'booking_stats' => ['total' => (int) ($bookingStats->total ?? 0), 'completed' => (int) ($bookingStats->completed ?? 0)],
        ]]);
    }

    /** POST /api/admin/users/create */
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['nullable', 'string'],
            'mobile_number' => ['required', 'string', 'unique:efm_customers,mobile_number'],
            'email' => ['nullable', 'email'],
        ]);

        $customer = Customer::create(array_merge($data, [
            'customer_uid' => (string) Str::uuid(), 'is_active' => true, 'mobile_verified' => false,
            'email_verified' => false, 'is_blocked' => false, 'spam_flag' => false, 'spam_score' => 0,
            'created_by' => 'admin', 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Customer created', 'data' => $customer], 201);
    }

    /** POST /api/admin/users/update */
    public function update(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer'],
            'first_name' => ['sometimes', 'string'],
            'last_name' => ['sometimes', 'nullable', 'string'],
            'email' => ['sometimes', 'nullable', 'email'],
        ]);
        $customer = Customer::findOrFail($data['customer_id']);
        $customer->update(array_merge(array_diff_key($data, ['customer_id' => true]), ['updated_by' => 'admin', 'updated_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Customer updated', 'data' => $customer->fresh()]);
    }

    /** POST /api/admin/users/verify — direct port of block/unblock toggle. */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer'],
            'is_blocked' => ['required', 'boolean'],
            'reason' => ['nullable', 'string'],
        ]);
        $customer = Customer::findOrFail($data['customer_id']);
        $customer->update([
            'is_blocked' => $data['is_blocked'],
            'blocked_at' => $data['is_blocked'] ? now() : null,
            'blocked_reason' => $data['is_blocked'] ? ($data['reason'] ?? null) : null,
            'blocked_by' => $data['is_blocked'] ? 'admin' : null,
            'updated_by' => 'admin', 'updated_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => $data['is_blocked'] ? 'Customer blocked' : 'Customer unblocked', 'data' => $customer->fresh()]);
    }

    /** GET /api/admin/users/{id}/bookings */
    public function bookings(Request $request, int $id)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = (int) $request->query('limit', 10);

        $query = Booking::where('customer_id', $id);
        $total = (clone $query)->count();
        $data = $query->orderByDesc('booking_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/users/{id}/addresses */
    public function addresses(int $id)
    {
        return response()->json(['status' => true, 'data' => CustomerAddress::where('customer_id', $id)->orderByDesc('address_id')->get()]);
    }

    /** GET /api/admin/users/{id}/activity-logs */
    public function activityLogs(Request $request, int $id)
    {
        $limit = min(100, (int) $request->query('limit', 50));
        $logs = ActivityLog::where('actor_type', 'customer')->where('actor_id', $id)
            ->orderByDesc('created_at')->limit($limit)->get();

        return response()->json(['status' => true, 'data' => $logs]);
    }
}
