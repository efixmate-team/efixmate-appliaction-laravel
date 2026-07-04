<?php

namespace App\Services;

use App\Contracts\SmsGateway;
use Illuminate\Support\Facades\Log;

/**
 * Stub SMS gateway — logs the OTP instead of calling MSG91 (the source Node app's
 * provider, per its MSG91_* env vars). A real client is a documented TODO; this keeps
 * OTP login testable in dev without gateway credentials, matching the foundation
 * phase's "no full dispatch" scoping.
 */
class LogSmsGateway implements SmsGateway
{
    public function sendOtp(string $mobileNumber, string $otp): void
    {
        Log::info("[LogSmsGateway] OTP for {$mobileNumber}: {$otp}");
    }
}
