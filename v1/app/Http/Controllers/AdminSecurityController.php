<?php

namespace App\Http\Controllers;

use App\Support\StepUpToken;
use Efixmate\Domain\Models\AdminFailedLogin;
use Efixmate\Domain\Models\AdminIpRule;
use Efixmate\Domain\Models\AdminSecurityEvent;
use Efixmate\Domain\Models\AdminSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

/** Direct port of the security cluster in server/.../admin/security.routes.js (15 endpoints). */
class AdminSecurityController extends Controller
{
    /** POST /api/admin/step-up */
    public function stepUp(Request $request)
    {
        $admin = $request->user();
        $token = StepUpToken::issue($admin->admin_id);
        AdminSecurityEvent::create([
            'admin_id' => $admin->admin_id, 'event_type' => 'step_up_issued', 'severity' => 'info',
            'ip_address' => $request->ip(), 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'data' => ['step_up_token' => $token, 'expires_in_minutes' => 10]]);
    }

    // ── Sessions ──
    /** GET /api/admin/security/sessions */
    public function sessions(Request $request)
    {
        $adminId = $request->query('admin_id', $request->user()->admin_id);

        return response()->json(['status' => true, 'data' => AdminSession::where('admin_id', $adminId)->where('is_active', true)->orderByDesc('last_seen_at')->get()]);
    }

    /** POST /api/admin/security/sessions/{id}/revoke */
    public function revokeSession(int $id)
    {
        $session = AdminSession::findOrFail($id);
        $session->update(['is_active' => false, 'revoked_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Session revoked', 'data' => $session->fresh()]);
    }

    /** POST /api/admin/security/sessions/revoke-all */
    public function revokeAllSessions(Request $request)
    {
        $adminId = $request->input('admin_id', $request->user()->admin_id);
        AdminSession::where('admin_id', $adminId)->where('is_active', true)->update(['is_active' => false, 'revoked_at' => now()]);
        $request->user()->tokens()->delete();

        return response()->json(['status' => true, 'message' => 'All sessions revoked']);
    }

    // ── IP rules ──
    /** GET /api/admin/security/ip-rules */
    public function ipRules()
    {
        return response()->json(['status' => true, 'data' => AdminIpRule::where('is_active', true)->orderByDesc('rule_id')->get()]);
    }

    /** POST /api/admin/security/ip-rules */
    public function storeIpRule(Request $request)
    {
        $data = $request->validate([
            'scope' => ['required', 'string', 'in:allow,deny'],
            'admin_id' => ['nullable', 'integer'],
            'ip_address' => ['nullable', 'string'],
            'cidr' => ['nullable', 'string'],
            'label' => ['nullable', 'string'],
        ]);
        $rule = AdminIpRule::create(array_merge($data, [
            'is_active' => true, 'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]));

        return response()->json(['status' => true, 'message' => 'IP rule created', 'data' => $rule], 201);
    }

    /** DELETE /api/admin/security/ip-rules/{id} */
    public function destroyIpRule(int $id)
    {
        AdminIpRule::where('rule_id', $id)->update(['is_active' => false, 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'IP rule removed']);
    }

    // ── Failed logins ──
    /** GET /api/admin/security/failed-logins */
    public function failedLogins(Request $request)
    {
        $limit = min(200, (int) $request->query('limit', 50));

        return response()->json(['status' => true, 'data' => AdminFailedLogin::orderByDesc('attempt_id')->limit($limit)->get()]);
    }

    // ── 2FA setup ──
    /** POST /api/admin/security/2fa/setup */
    public function setup2fa(Request $request)
    {
        $admin = $request->user();
        $secret = Google2FA::generateSecretKey();
        $admin->update(['totp_secret_encrypted' => Crypt::encryptString($secret), 'totp_enabled' => false]);
        $qrCodeUrl = Google2FA::getQRCodeUrl('eFixMate Admin', $admin->email ?? $admin->admin_uid, $secret);

        return response()->json(['status' => true, 'data' => ['secret' => $secret, 'qr_code_url' => $qrCodeUrl]]);
    }

    /** POST /api/admin/security/2fa/enable */
    public function enable2fa(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $admin = $request->user();
        abort_if(! $admin->totp_secret_encrypted, 400, 'Run 2FA setup first');
        $secret = Crypt::decryptString($admin->totp_secret_encrypted);
        abort_unless(Google2FA::verifyKey($secret, $data['code']), 400, 'Invalid code');

        $admin->update(['totp_enabled' => true]);
        AdminSecurityEvent::create(['admin_id' => $admin->admin_id, 'event_type' => '2fa_enabled', 'severity' => 'info', 'ip_address' => $request->ip(), 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => '2FA enabled']);
    }

    /** POST /api/admin/security/2fa/disable */
    public function disable2fa(Request $request)
    {
        $admin = $request->user();
        $admin->update(['totp_enabled' => false, 'totp_secret_encrypted' => null]);
        AdminSecurityEvent::create(['admin_id' => $admin->admin_id, 'event_type' => '2fa_disabled', 'severity' => 'warning', 'ip_address' => $request->ip(), 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => '2FA disabled']);
    }

    // ── Security events ──
    /** GET /api/admin/security/events */
    public function events(Request $request)
    {
        $limit = min(200, (int) $request->query('limit', 50));
        $query = AdminSecurityEvent::query();
        if ($request->filled('admin_id')) $query->where('admin_id', $request->query('admin_id'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('event_id')->limit($limit)->get()]);
    }
}
