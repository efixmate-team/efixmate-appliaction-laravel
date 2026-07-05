<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\DeviceToken;
use Efixmate\Domain\Models\Notification;
use Illuminate\Http\Request;

/**
 * Direct port of the /user/home/device/register and /user/notifications/unread-count
 * inline handlers in server/src/modules/user/routes/user.routes.js.
 */
class CustomerDeviceController extends Controller
{
    /** POST /api/user/home/device/register */
    public function registerDevice(Request $request)
    {
        $token = $request->input('fcm_token') ?? $request->input('fcmToken');
        abort_if(! $token, 400, 'fcm_token is required');

        $platform = $request->input('platform', 'android');
        $customerId = $request->user()->customer_id;
        $token = substr((string) $token, 0, 512);

        $existing = DeviceToken::where('user_type', 'CUSTOMER')->where('user_id', $customerId)->where('fcm_token', $token)->first();
        if ($existing) {
            $existing->update(['platform' => $platform, 'is_active' => true, 'updated_at' => now()]);
        } else {
            DeviceToken::create([
                'user_type' => 'CUSTOMER', 'user_id' => $customerId, 'fcm_token' => $token,
                'platform' => $platform, 'is_active' => true, 'updated_at' => now(),
            ]);
        }

        return response()->json(['status' => true, 'message' => 'Device registered for push notifications']);
    }

    /** GET /api/user/notifications/unread-count */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('recipient_type', 'CUSTOMER')
            ->where('recipient_id', $request->user()->customer_id)
            ->where('is_read', false)
            ->where('is_deleted', false)
            ->count();

        return response()->json(['status' => true, 'data' => ['unread_count' => $count]]);
    }
}
