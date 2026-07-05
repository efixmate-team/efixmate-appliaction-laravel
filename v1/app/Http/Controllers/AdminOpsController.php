<?php

namespace App\Http\Controllers;

use App\Jobs\DispatchBookingJob;
use App\Jobs\SettleBookingJob;
use Efixmate\Domain\Models\Booking;
use Efixmate\Domain\Models\BookingLock;
use Efixmate\Domain\Models\CancellationPolicy;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\ModuleQueueFailure;
use Efixmate\Domain\Models\NoServiceQueue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of admin/ops/ops.routes.js — queue DLQ, monitoring, manual
 * recovery actions, NO_SERVICE queue, cancellation-policy CRUD, retention job
 * (19 endpoints + operational.routes.js's 6 inline endpoints, consolidated here).
 */
class AdminOpsController extends Controller
{
    // ── Monitoring ──
    /** GET /api/admin/ops/monitoring/summary */
    public function monitoringSummary()
    {
        return response()->json(['status' => true, 'data' => [
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'pending_no_service' => NoServiceQueue::where('status', 'pending')->count(),
            'active_locks' => BookingLock::where('is_active', true)->count(),
            'queue_connection' => config('queue.default'),
        ]]);
    }

    // ── Dead-letter queue (Laravel's native failed_jobs table) ──
    /** GET /api/admin/ops/queue/failed */
    public function failedJobs(Request $request)
    {
        $limit = min(200, (int) $request->query('limit', 50));
        $rows = DB::table('failed_jobs')->orderByDesc('id')->limit($limit)->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** POST /api/admin/ops/queue/{uuid}/replay */
    public function replayFailedJob(string $uuid)
    {
        \Illuminate\Support\Facades\Artisan::call('queue:retry', ['id' => [$uuid]]);

        return response()->json(['status' => true, 'message' => 'Job re-queued for retry']);
    }

    /** DELETE /api/admin/ops/queue/{uuid} */
    public function deleteFailedJob(string $uuid)
    {
        DB::table('failed_jobs')->where('uuid', $uuid)->delete();

        return response()->json(['status' => true, 'message' => 'Failed job removed']);
    }

    // ── Module queue failures (custom DLQ used by our own job classes) ──
    /** GET /api/admin/ops/module-failures */
    public function moduleFailures(Request $request)
    {
        $query = ModuleQueueFailure::query();
        if ($request->filled('module')) $query->where('module', $request->query('module'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('failure_id')->limit(100)->get()]);
    }

    /** POST /api/admin/ops/module-failures/{id}/replay */
    public function replayModuleFailure(int $id)
    {
        $failure = ModuleQueueFailure::findOrFail($id);
        $failure->update(['replay_count' => $failure->replay_count + 1]);

        return match ($failure->job_name) {
            'DispatchBookingJob' => tap(DispatchBookingJob::dispatch($failure->payload), fn () => null),
            'SettleBookingJob' => tap(SettleBookingJob::dispatch($failure->payload), fn () => null),
            default => null,
        } ? response()->json(['status' => true, 'message' => 'Job replayed', 'data' => $failure->fresh()])
          : response()->json(['status' => false, 'message' => 'Unknown job type, cannot replay'], 400);
    }

    // ── Manual recovery actions ──
    /** POST /api/admin/ops/bookings/{id}/retry-dispatch */
    public function retryDispatch(int $id)
    {
        $booking = Booking::findOrFail($id);
        DispatchBookingJob::dispatch(['booking_id' => $booking->booking_id]);

        return response()->json(['status' => true, 'message' => 'Dispatch retried']);
    }

    /** POST /api/admin/ops/bookings/{id}/retry-settlement */
    public function retrySettlement(int $id)
    {
        $booking = Booking::findOrFail($id);
        SettleBookingJob::dispatch(['booking_id' => $booking->booking_id]);

        return response()->json(['status' => true, 'message' => 'Settlement retried']);
    }

    /** POST /api/admin/ops/locks/{id}/unlock */
    public function unlockLock(int $lockId)
    {
        $lock = BookingLock::where('lock_id', $lockId)->firstOrFail();
        $lock->update(['is_active' => false, 'lock_status' => 'RELEASED']);

        return response()->json(['status' => true, 'message' => 'Lock released', 'data' => $lock->fresh()]);
    }

    /** POST /api/admin/ops/bookings/{id}/force-assign */
    public function forceAssign(Request $request, int $id)
    {
        $data = $request->validate(['technician_id' => ['required', 'integer']]);
        $booking = Booking::findOrFail($id);
        $booking->update(['technician_id' => $data['technician_id'], 'assigned_at' => now(), 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Technician force-assigned', 'data' => $booking->fresh()]);
    }

    // ── NO_SERVICE queue ──
    /** GET /api/admin/ops/no-service-queue */
    public function noServiceQueue(Request $request)
    {
        $query = NoServiceQueue::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('enqueued_at')->get()]);
    }

    /** POST /api/admin/ops/no-service-queue/{id}/resolve */
    public function resolveNoService(Request $request, int $id)
    {
        $data = $request->validate(['note' => ['nullable', 'string']]);
        $entry = NoServiceQueue::findOrFail($id);
        $entry->update(['status' => 'resolved', 'note' => $data['note'] ?? $entry->note, 'resolved_at' => now(), 'resolved_by' => $request->user()->admin_id]);

        return response()->json(['status' => true, 'message' => 'Entry resolved', 'data' => $entry->fresh()]);
    }

    // ── Cancellation policies ──
    /** GET /api/admin/ops/cancellation-policies */
    public function cancellationPolicies()
    {
        return response()->json(['status' => true, 'data' => CancellationPolicy::where('is_active', true)->orderBy('window_hours')->get()]);
    }

    /** POST /api/admin/ops/cancellation-policies */
    public function storeCancellationPolicy(Request $request)
    {
        $data = $request->validate([
            'window_hours' => ['required', 'integer'], 'fee_type' => ['required', 'string', 'in:FLAT,PERCENTAGE'],
            'fee_value' => ['required', 'numeric'], 'description' => ['nullable', 'string'],
        ]);
        $policy = CancellationPolicy::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Policy created', 'data' => $policy], 201);
    }

    /** DELETE /api/admin/ops/cancellation-policies/{id} */
    public function destroyCancellationPolicy(int $id)
    {
        CancellationPolicy::where('policy_id', $id)->update(['is_active' => false, 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Policy removed']);
    }

    // ── Retention ──
    /** POST /api/admin/ops/run-retention — data-retention sweep, also runnable as a scheduled command. */
    public function runRetention()
    {
        $cutoff = now()->subYears(2);
        $purgedLogs = DB::table('efm_activity_logs')->where('created_at', '<', $cutoff)->delete();
        $purgedOtps = DB::table('efm_customer_login_otp')->where('created_at', '<', now()->subDays(1))->delete();

        return response()->json(['status' => true, 'message' => 'Retention sweep completed', 'data' => [
            'activity_logs_purged' => $purgedLogs, 'expired_otps_purged' => $purgedOtps,
        ]]);
    }
}
