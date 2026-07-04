<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

/**
 * 2FA groundwork only — not enforced as a mandatory second login factor in this
 * phase (see Stage 4 scoping). Operates on the existing totp_enabled /
 * totp_secret_encrypted columns so it stays compatible with data the source
 * Node app already wrote for admins who enabled 2FA there.
 */
class TwoFactorController extends Controller
{
    public function enable(Request $request)
    {
        $admin = Auth::user();
        $secret = Google2FA::generateSecretKey();

        $admin->forceFill(['totp_secret_encrypted' => Crypt::encryptString($secret)])->save();

        return response()->json([
            'secret' => $secret,
            'otpauth_url' => Google2FA::getQRCodeUrl(
                config('app.name'),
                $admin->email,
                $secret,
            ),
        ]);
    }

    public function confirm(Request $request)
    {
        $request->validate(['code' => ['required', 'string']]);

        $admin = Auth::user();
        abort_unless($admin->totp_secret_encrypted, 422, 'Call /enable first.');

        $secret = Crypt::decryptString($admin->totp_secret_encrypted);
        abort_unless(Google2FA::verifyKey($secret, $request->string('code')), 422, 'Invalid code.');

        $admin->forceFill(['totp_enabled' => true])->save();

        return response()->json(['status' => true]);
    }
}
