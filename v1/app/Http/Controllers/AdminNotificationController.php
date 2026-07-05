<?php

namespace App\Http\Controllers;

use App\Jobs\SendNotificationJob;
use Efixmate\Domain\Models\AdminNotificationCampaign;
use Efixmate\Domain\Models\AdminNotificationDelivery;
use Efixmate\Domain\Models\AdminNotificationInbox;
use Efixmate\Domain\Models\AdminNotificationSchedule;
use Efixmate\Domain\Models\AdminNotificationTemplate;
use Illuminate\Http\Request;

/** Direct port of the notifications cluster in server/.../admin/notifications.routes.js (26 endpoints). */
class AdminNotificationController extends Controller
{
    // ── Templates ──
    /** GET /api/admin/notifications/templates */
    public function templates(Request $request)
    {
        $query = AdminNotificationTemplate::query();
        if ($request->filled('channel')) $query->where('channel', $request->query('channel'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('template_id')->get()]);
    }

    /** GET /api/admin/notifications/templates/{id} */
    public function showTemplate(int $id)
    {
        return response()->json(['status' => true, 'data' => AdminNotificationTemplate::findOrFail($id)]);
    }

    /** POST /api/admin/notifications/templates */
    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'channel' => ['required', 'string'],
            'template_key' => ['required', 'string'],
            'title' => ['nullable', 'string'],
            'body' => ['required', 'string'],
            'variables' => ['nullable', 'array'],
        ]);
        $tpl = AdminNotificationTemplate::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Template created', 'data' => $tpl], 201);
    }

    /** PUT /api/admin/notifications/templates/{id} */
    public function updateTemplate(Request $request, int $id)
    {
        $tpl = AdminNotificationTemplate::findOrFail($id);
        $tpl->update(array_merge($request->only(['title', 'body', 'variables', 'is_active']), ['updated_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Template updated', 'data' => $tpl->fresh()]);
    }

    /** DELETE /api/admin/notifications/templates/{id} */
    public function destroyTemplate(int $id)
    {
        AdminNotificationTemplate::where('template_id', $id)->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Template deleted']);
    }

    // ── Campaigns ──
    /** GET /api/admin/notifications/campaigns */
    public function campaigns(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 20));
        $query = AdminNotificationCampaign::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('campaign_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/notifications/campaigns/{id} */
    public function showCampaign(int $id)
    {
        $campaign = AdminNotificationCampaign::findOrFail($id);
        $deliveries = AdminNotificationDelivery::where('campaign_id', $id)->orderByDesc('delivery_id')->limit(100)->get();

        return response()->json(['status' => true, 'data' => ['campaign' => $campaign, 'deliveries' => $deliveries]]);
    }

    /** POST /api/admin/notifications/campaigns */
    public function storeCampaign(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'channel' => ['required', 'string'],
            'template_id' => ['nullable', 'integer'],
            'audience' => ['nullable', 'array'],
            'message_body' => ['nullable', 'string'],
            'is_broadcast' => ['nullable', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $campaign = AdminNotificationCampaign::create(array_merge($data, [
            'status' => $request->filled('scheduled_at') ? 'scheduled' : 'draft',
            'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Campaign created', 'data' => $campaign], 201);
    }

    /** POST /api/admin/notifications/campaigns/{id}/send-broadcast */
    public function sendBroadcast(int $id)
    {
        $campaign = AdminNotificationCampaign::findOrFail($id);
        $campaign->update(['status' => 'sending', 'is_broadcast' => true, 'updated_at' => now()]);
        SendNotificationJob::dispatch(['campaign_id' => $campaign->campaign_id]);
        $campaign->update(['status' => 'sent', 'sent_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Broadcast queued', 'data' => $campaign->fresh()]);
    }

    /** POST /api/admin/notifications/campaigns/{id}/send-single */
    public function sendSingle(Request $request, int $id)
    {
        $data = $request->validate(['recipient_type' => ['required', 'string'], 'recipient_id' => ['required', 'integer']]);
        $campaign = AdminNotificationCampaign::findOrFail($id);

        $delivery = AdminNotificationDelivery::create([
            'campaign_id' => $campaign->campaign_id, 'recipient_type' => $data['recipient_type'], 'recipient_id' => $data['recipient_id'],
            'channel' => $campaign->channel, 'status' => 'pending', 'message_body' => $campaign->message_body,
            'template_id' => $campaign->template_id, 'retry_count' => 0, 'max_retries' => 3, 'created_at' => now(),
        ]);
        SendNotificationJob::dispatch(['campaign_id' => $campaign->campaign_id, 'delivery_id' => $delivery->delivery_id]);

        return response()->json(['status' => true, 'message' => 'Notification queued', 'data' => $delivery], 201);
    }

    // ── Delivery logs ──
    /** GET /api/admin/notifications/delivery-logs */
    public function deliveryLogs(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 25));
        $query = AdminNotificationDelivery::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        if ($request->filled('campaign_id')) $query->where('campaign_id', $request->query('campaign_id'));

        $total = (clone $query)->count();
        $data = $query->orderByDesc('delivery_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** POST /api/admin/notifications/delivery-logs/{id}/retry */
    public function retryDelivery(int $id)
    {
        $delivery = AdminNotificationDelivery::findOrFail($id);
        $delivery->update(['status' => 'pending', 'retry_count' => $delivery->retry_count + 1, 'error_message' => null, 'updated_at' => now()]);
        SendNotificationJob::dispatch(['campaign_id' => $delivery->campaign_id, 'delivery_id' => $delivery->delivery_id]);

        return response()->json(['status' => true, 'message' => 'Retry queued', 'data' => $delivery->fresh()]);
    }

    // ── Schedules ──
    /** GET /api/admin/notifications/schedules */
    public function schedules(Request $request)
    {
        $query = AdminNotificationSchedule::query();
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        return response()->json(['status' => true, 'data' => $query->orderBy('scheduled_at')->get()]);
    }

    /** POST /api/admin/notifications/schedules */
    public function storeSchedule(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string'],
            'channel' => ['required', 'string'],
            'template_id' => ['nullable', 'integer'],
            'audience' => ['nullable', 'array'],
            'payload' => ['nullable', 'array'],
            'scheduled_at' => ['required', 'date'],
        ]);
        $schedule = AdminNotificationSchedule::create(array_merge($data, [
            'status' => 'pending', 'retry_count' => 0, 'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'Schedule created', 'data' => $schedule], 201);
    }

    /** DELETE /api/admin/notifications/schedules/{id} */
    public function destroySchedule(int $id)
    {
        AdminNotificationSchedule::where('schedule_id', $id)->update(['status' => 'cancelled', 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Schedule cancelled']);
    }

    /** POST /api/admin/notifications/schedules/process-due */
    public function processDue()
    {
        $due = AdminNotificationSchedule::where('status', 'pending')->where('scheduled_at', '<=', now())->get();
        foreach ($due as $schedule) {
            $campaign = AdminNotificationCampaign::create([
                'name' => $schedule->title, 'channel' => $schedule->channel, 'template_id' => $schedule->template_id,
                'audience' => $schedule->audience, 'is_broadcast' => true, 'status' => 'sending',
                'created_by' => $schedule->created_by, 'created_at' => now(),
            ]);
            SendNotificationJob::dispatch(['campaign_id' => $campaign->campaign_id]);
            $campaign->update(['status' => 'sent', 'sent_at' => now()]);
            $schedule->update(['status' => 'processed', 'campaign_id' => $campaign->campaign_id, 'updated_at' => now()]);
        }

        return response()->json(['status' => true, 'message' => "{$due->count()} schedules processed", 'processed' => $due->count()]);
    }

    // ── Admin inbox ──
    /** GET /api/admin/notifications/inbox */
    public function inbox(Request $request)
    {
        $adminId = $request->user()->admin_id;
        $query = AdminNotificationInbox::where('admin_id', $adminId);
        if ($request->boolean('unread_only')) $query->where('is_read', false);

        return response()->json(['status' => true, 'data' => $query->orderByDesc('created_at')->limit(50)->get()]);
    }

    /** POST /api/admin/notifications/inbox/{id}/read */
    public function markRead(Request $request, int $id)
    {
        $row = AdminNotificationInbox::where('inbox_id', $id)->where('admin_id', $request->user()->admin_id)->firstOrFail();
        $row->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Marked read', 'data' => $row->fresh()]);
    }

    /** POST /api/admin/notifications/inbox/read-all */
    public function markAllRead(Request $request)
    {
        AdminNotificationInbox::where('admin_id', $request->user()->admin_id)->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['status' => true, 'message' => 'All marked read']);
    }

    /** GET /api/admin/notifications/inbox/unread-count */
    public function unreadCount(Request $request)
    {
        $count = AdminNotificationInbox::where('admin_id', $request->user()->admin_id)->where('is_read', false)->count();

        return response()->json(['status' => true, 'data' => ['unread_count' => $count]]);
    }
}
