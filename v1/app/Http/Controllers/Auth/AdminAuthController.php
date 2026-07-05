<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Efixmate\Domain\Models\Admin;
use Efixmate\Domain\Models\AdminFailedLogin;
use Efixmate\Domain\Models\AdminSecurityEvent;
use Efixmate\Domain\Models\AdminSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

/**
 * Direct port of AdminController.adminLogin/adminLoginDev + AdminAuthSecurityService
 * (server/src/modules/admin/security/Services/adminAuthSecurity.service.js): magic-link
 * admin_uid+email+password login, 5-attempt lockout (15 min), pending-2FA step, session
 * tracking. Node signs JWTs for the access/pending-2FA tokens; v1 already standardizes on
 * Sanctum for the final access token (matching every other guard in this app) and Laravel's
 * Crypt facade for the short-lived pending-2FA token (same pattern as StepUpToken — no JWT
 * dependency pulled in just for one internal token shape). IP allowlist checking (Node's
 * isIpAllowedForAdmin) is not ported — no traffic-shaping infra exists in local/dev yet;
 * revisit if AdminIpRule enforcement is needed before production.
 */
class AdminAuthController extends Controller
{
    private const LOCK_THRESHOLD = 5;

    public function login(Request $request)
    {
        return $this->attemptLogin($request);
    }

    /** POST /api/admin/login-dev — resolves admin_uid from email, blocked outside local. */
    public function loginDev(Request $request)
    {
        abort_if(! app()->environment('local'), 403, 'Dev login is not available in production');

        $data = $request->validate(['username' => ['required', 'email'], 'password' => ['required', 'string']]);

        $admin = Admin::where('email', $data['username'])->first();
        if (! $admin) {
            return response()->json(['status' => false, 'message' => 'Admin not found']);
        }

        $request->merge(['admin_uid' => $admin->admin_uid]);

        return $this->attemptLogin($request);
    }

    private function attemptLogin(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'admin_uid' => ['required', 'string'],
        ]);

        $ip = $request->ip();
        $ua = $request->userAgent();

        $admin = Admin::where('admin_uid', $data['admin_uid'])->first();
        if (! $admin) {
            AdminFailedLogin::create(['email' => $data['username'], 'ip_address' => $ip, 'user_agent' => $ua, 'reason' => 'admin_not_found', 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Admin not found']);
        }

        if (! $admin->is_active) {
            AdminFailedLogin::create(['admin_id' => $admin->admin_id, 'email' => $data['username'], 'ip_address' => $ip, 'user_agent' => $ua, 'reason' => 'inactive', 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Account is disabled']);
        }

        if ($admin->locked_until && $admin->locked_until->isFuture()) {
            AdminSecurityEvent::create(['admin_id' => $admin->admin_id, 'event_type' => 'LOGIN_LOCKED', 'severity' => 'high', 'description' => 'Login attempt while account locked', 'ip_address' => $ip, 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Account temporarily locked. Try again later.']);
        }

        if ($admin->email !== $data['username']) {
            AdminFailedLogin::create(['admin_id' => $admin->admin_id, 'email' => $data['username'], 'ip_address' => $ip, 'user_agent' => $ua, 'reason' => 'email_mismatch', 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Email does not match this login link']);
        }

        if (! Hash::check($data['password'], $admin->password)) {
            $admin->increment('failed_login_count');
            if ($admin->failed_login_count >= self::LOCK_THRESHOLD) {
                $admin->update(['locked_until' => now()->addMinutes(15)]);
                AdminSecurityEvent::create(['admin_id' => $admin->admin_id, 'event_type' => 'ACCOUNT_LOCKED', 'severity' => 'critical', 'description' => 'Too many failed login attempts', 'ip_address' => $ip, 'created_at' => now()]);
            }
            AdminFailedLogin::create(['admin_id' => $admin->admin_id, 'email' => $data['username'], 'ip_address' => $ip, 'user_agent' => $ua, 'reason' => 'bad_password', 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Invalid password']);
        }

        $admin->update(['failed_login_count' => 0, 'locked_until' => null]);

        if ($admin->totp_enabled) {
            $pending = Crypt::encryptString(json_encode([
                'admin_id' => $admin->admin_id, 'purpose' => 'admin_2fa_pending', 'expires_at' => now()->addMinutes(5)->timestamp,
            ]));

            return response()->json(['status' => true, 'requires2fa' => true, 'pendingToken' => $pending, 'message' => 'Two-factor authentication required']);
        }

        return $this->completeLogin($admin, $request);
    }

    /** POST /api/admin/login/verify-2fa */
    public function verify2fa(Request $request)
    {
        $data = $request->validate(['pendingToken' => ['required', 'string'], 'code' => ['required', 'string']]);

        try {
            $payload = json_decode(Crypt::decryptString($data['pendingToken']), true);
        } catch (\Throwable) {
            return response()->json(['status' => false, 'message' => '2FA session expired'], 401);
        }

        if (($payload['purpose'] ?? null) !== 'admin_2fa_pending' || ($payload['expires_at'] ?? 0) < now()->timestamp) {
            return response()->json(['status' => false, 'message' => 'Invalid 2FA token'], 401);
        }

        $admin = Admin::find($payload['admin_id']);
        abort_if(! $admin, 403, 'Account disabled');

        $secret = $admin->totp_secret_encrypted ? Crypt::decryptString($admin->totp_secret_encrypted) : null;
        if (! $secret || ! Google2FA::verifyKey($secret, $data['code'])) {
            AdminFailedLogin::create(['admin_id' => $admin->admin_id, 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'reason' => 'bad_2fa', 'created_at' => now()]);

            return response()->json(['status' => false, 'message' => 'Invalid authentication code']);
        }

        abort_unless($admin->is_active, 403, 'Account disabled');

        return $this->completeLogin($admin, $request);
    }

    private function completeLogin(Admin $admin, Request $request)
    {
        $token = $admin->createToken('admin-api')->plainTextToken;

        AdminSession::create([
            'admin_id' => $admin->admin_id, 'device_id' => null, 'device_name' => $request->userAgent(),
            'platform' => null, 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(),
            'token_jti' => explode('|', $token)[0], 'is_active' => true, 'last_seen_at' => now(), 'created_at' => now(),
        ]);

        AdminSecurityEvent::create(['admin_id' => $admin->admin_id, 'event_type' => 'LOGIN_SUCCESS', 'severity' => 'info', 'description' => 'Admin logged in', 'ip_address' => $request->ip(), 'created_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Login successful', 'id' => $admin->admin_id, 'token' => $token]);
    }

    /** POST /api/admin/logout */
    public function logout(Request $request)
    {
        $admin = $request->user();
        $tokenId = $admin?->currentAccessToken()?->id;
        if ($tokenId) {
            AdminSession::where('token_jti', (string) $tokenId)->update(['is_active' => false, 'revoked_at' => now()]);
        }
        $admin?->currentAccessToken()?->delete();

        return response()->json(['status' => true, 'message' => 'Logged out successfully']);
    }

    /** GET /api/admin/profile */
    public function profile(Request $request)
    {
        return response()->json(['status' => true, 'data' => $request->user()]);
    }
}
