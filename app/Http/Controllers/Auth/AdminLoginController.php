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
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
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

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request)
    {
        $admin = Auth::user();

        if ($admin) {
            AdminSession::where('admin_id', $admin->admin_id)
                ->where('token_jti', $request->session()->getId())
                ->update(['is_active' => false, 'revoked_at' => now()]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
