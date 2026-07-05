<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\SystemSetting;
use Illuminate\Http\Request;

/**
 * Direct port of the key-value app-settings cluster in server/.../admin.routes.js:
 * payment-gateway, notifications, referral, and upload-settings — each stored as a
 * row in efm_system_settings keyed by setting_key, matching Node's settings.service.js.
 */
class AdminSettingsController extends Controller
{
    private const KEYS = [
        'payment-gateway' => 'payment_gateway_settings',
        'notifications' => 'notification_settings',
        'referral' => 'referral_settings',
        'upload' => 'upload_settings',
    ];

    private function get(string $group)
    {
        $key = self::KEYS[$group] ?? abort(404, 'Unknown settings group');
        $row = SystemSetting::find($key);

        return response()->json(['status' => true, 'data' => $row?->setting_value ?? new \stdClass]);
    }

    private function put(Request $request, string $group)
    {
        $key = self::KEYS[$group] ?? abort(404, 'Unknown settings group');
        $row = SystemSetting::updateOrCreate(
            ['setting_key' => $key],
            ['setting_value' => $request->all(), 'updated_by' => 'admin', 'updated_at' => now()],
        );

        return response()->json(['status' => true, 'message' => 'Settings saved', 'data' => $row->setting_value]);
    }

    /** GET /api/admin/settings/payment-gateway */
    public function getPaymentGateway() { return $this->get('payment-gateway'); }

    /** PUT /api/admin/settings/payment-gateway */
    public function putPaymentGateway(Request $request) { return $this->put($request, 'payment-gateway'); }

    /** GET /api/admin/settings/notifications */
    public function getNotifications() { return $this->get('notifications'); }

    /** PUT /api/admin/settings/notifications */
    public function putNotifications(Request $request) { return $this->put($request, 'notifications'); }

    /** GET /api/admin/settings/referral */
    public function getReferral() { return $this->get('referral'); }

    /** PUT /api/admin/settings/referral */
    public function putReferral(Request $request) { return $this->put($request, 'referral'); }

    /** GET /api/admin/settings/upload */
    public function getUpload() { return $this->get('upload'); }

    /** PUT /api/admin/settings/upload */
    public function putUpload(Request $request) { return $this->put($request, 'upload'); }
}
