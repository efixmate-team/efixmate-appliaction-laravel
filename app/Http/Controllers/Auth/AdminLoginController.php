<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Efixmate\Domain\Models\AdminSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminLoginController extends Controller
{
    /** GET /admin/login — generic entry, no magic-link admin_uid known yet. */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', ['adminUid' => null]);
    }

    /**
     * GET /login/{admin_uid} — the actual admin entry point in the source Node app
     * (AdminController's adminLoginUrl() builds exactly this path). The admin_uid
     * segment is the "invite" half of login; email+password is the "proof" half —
     * see store()'s matching check.
     */
    public function createWithUid(string $adminUid): Response
    {
        return Inertia::render('Auth/Login', ['adminUid' => $adminUid]);
    }

    /**
     * POST /check-uid — direct port of the source Node app's app.js /check-uid
     * handler: looks up efm_admins by admin_uid only (no auth), used by the login
     * page to decide whether to show the sign-in form or an "invalid link" screen
     * before the admin ever types a password.
     */
    public function checkUid(Request $request)
    {
        $uid = (string) $request->input('uid', '');
        if ($uid === '') {
            return response()->json(['message' => 'UID is required'], 400);
        }

        $exists = Admin::where('admin_uid', $uid)->exists();

        return response()->json($exists
            ? ['exists' => true, 'belongsTo' => 'ADMIN', 'message' => 'UID exists']
            : ['exists' => false, 'message' => 'UID not found']);
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'admin_uid' => ['required', 'string'],
        ]);

        $target = Admin::where('admin_uid', $credentials['admin_uid'])->first();
        if (! $target || $target->email !== $credentials['email']) {
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials.',
            ]);
        }

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials.',
            ]);
        }

        $request->session()->regenerate();

        /** @var Admin $admin */
        $admin = Auth::user();

        if (! $admin->is_active) {
            Auth::logout();
            throw ValidationException::withMessages(['email' => 'Account disabled.']);
        }

        // Session tracking groundwork (see Stage 4 scoping) — Laravel's session id
        // stands in for the source system's JWT `jti`, since this guard is session-based.
        AdminSession::create([
            'admin_id' => $admin->admin_id,
            'device_id' => null,
            'device_name' => $request->userAgent(),
            'platform' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'token_jti' => $request->session()->getId(),
            'is_active' => true,
            'last_seen_at' => now(),
            'created_at' => now(),
        ]);

        // Bridge token for the v1 API (separate Laravel install, same DB/Admin model/
        // personal_access_tokens table): minted directly via Eloquent rather than an
        // HTTP round-trip to v1's own /admin/login, then handed to the browser once
        // via Inertia's shared props (see HandleInertiaRequests) so every admin Vue
        // page's fetch() calls can attach it as a Bearer header.
        $admin->tokens()->where('name', 'outer-app-bridge')->delete();
        $request->session()->put('v1_admin_token', $admin->createToken('outer-app-bridge')->plainTextToken);

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request)
    {
        $admin = Auth::user();

        if ($admin) {
            AdminSession::where('admin_id', $admin->admin_id)
                ->where('token_jti', $request->session()->getId())
                ->update(['is_active' => false, 'revoked_at' => now()]);

            $admin->tokens()->where('name', 'outer-app-bridge')->delete();
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
