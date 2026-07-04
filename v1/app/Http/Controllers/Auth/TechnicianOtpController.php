<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\SmsGateway;
use App\Http\Controllers\Controller;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianLoginOtp;
use Efixmate\Domain\Models\TechnicianSession;
use Illuminate\Http\Request;

class TechnicianOtpController extends Controller
{
    public function __construct(private SmsGateway $sms) {}

    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'mobile_number' => ['required', 'string', 'max:15'],
        ]);

        $otp = (string) random_int(100000, 999999);
        $technician = Technician::where('mobile_number', $data['mobile_number'])->first();

        TechnicianLoginOtp::create([
            'technician_id' => $technician?->technician_id,
            'mobile_number' => $data['mobile_number'],
            'otp' => $otp,
            'ip_address' => $request->ip(),
            'attempts' => 0,
            'is_registered' => (bool) $technician,
            'generated_at' => now(),
            'expired_at' => now()->addMinutes(5),
            'created_at' => now(),
            'created_by' => 'system',
        ]);

        $this->sms->sendOtp($data['mobile_number'], $otp);

        return response()->json([
            'status' => true,
            'message' => 'OTP sent.',
            ...(app()->environment('local') ? ['debug_otp' => $otp] : []),
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'mobile_number' => ['required', 'string', 'max:15'],
            'otp' => ['required', 'string'],
        ]);

        $record = TechnicianLoginOtp::where('mobile_number', $data['mobile_number'])
            ->orderByDesc('login_id')
            ->first();

        abort_unless($record, 422, 'No OTP request found for this number.');
        abort_if($record->attempts >= 5, 422, 'Too many attempts.');
        abort_if(now()->greaterThan($record->expired_at), 422, 'OTP expired.');

        if ($record->otp !== (int) $data['otp']) {
            $record->increment('attempts');
            abort(422, 'Invalid OTP.');
        }

        $technician = Technician::where('mobile_number', $data['mobile_number'])->first();
        $isNew = ! $technician;

        if ($isNew) {
            $technician = Technician::create([
                'first_name' => 'New',
                'mobile_number' => $data['mobile_number'],
                'is_selfie_verified' => false,
                'is_active' => false,
                'application_status' => 'draft',
                'current_jobs' => 0,
                'max_jobs' => 1,
                'is_online' => false,
                'vacation_mode' => false,
                'geo_fence_enabled' => false,
                'service_radius_km' => 10,
                'availability_status' => 'AVAILABLE',
                'avg_rating' => 0,
                'review_count' => 0,
                'created_by' => 'system',
                'created_at' => now(),
            ]);
        }

        $record->update(['technician_id' => $technician->technician_id, 'is_registered' => true]);

        // Single-active-session-per-technician (unlike customer, which allows concurrent sessions).
        TechnicianSession::where('technician_id', $technician->technician_id)
            ->where('is_active', true)
            ->update(['is_active' => false, 'revoked_at' => now()]);

        $token = $technician->createToken('technician-api')->plainTextToken;

        TechnicianSession::create([
            'technician_id' => $technician->technician_id,
            'device_id' => null,
            'device_name' => $request->userAgent(),
            'platform' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'is_active' => true,
            'last_seen_at' => now(),
            'created_at' => now(),
        ]);

        return response()->json([
            'status' => true,
            'token' => $token,
            'is_registered' => ! $isNew,
            'application_status' => $technician->application_status,
            'technician' => $technician,
        ]);
    }
}
