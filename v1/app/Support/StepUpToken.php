<?php

namespace App\Support;

use Illuminate\Support\Facades\Crypt;

/**
 * Analog of the Node app's signStepUp()/verifyStepUpToken() (a 10-minute JWT with
 * purpose='admin_step_up'). v1 has no JWT dependency, so this uses Laravel's native
 * Crypt facade (APP_KEY-backed, tamper-proof, same expiring-token security property)
 * instead of pulling in a JWT library just for this one internal token shape — the
 * endpoint contract (issue via POST /admin/step-up, send back via a header) is
 * unchanged, only the token's internal format differs.
 */
class StepUpToken
{
    private const TTL_MINUTES = 10;

    public static function issue(int $adminId): string
    {
        return Crypt::encryptString(json_encode([
            'admin_id' => $adminId,
            'purpose' => 'admin_step_up',
            'expires_at' => now()->addMinutes(self::TTL_MINUTES)->timestamp,
        ]));
    }

    public static function verify(?string $token, int $adminId): bool
    {
        if (! $token) return false;

        try {
            $payload = json_decode(Crypt::decryptString($token), true);
        } catch (\Throwable) {
            return false;
        }

        return ($payload['purpose'] ?? null) === 'admin_step_up'
            && ($payload['admin_id'] ?? null) === $adminId
            && ($payload['expires_at'] ?? 0) > now()->timestamp;
    }
}
