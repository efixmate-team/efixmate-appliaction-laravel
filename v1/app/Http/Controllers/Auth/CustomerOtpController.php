<?php

namespace App\Http\Controllers\Auth;

use App\Contracts\SmsGateway;
use App\Http\Controllers\Controller;
use Efixmate\Domain\Models\Customer;
use Efixmate\Domain\Models\CustomerLoginOtp;
use Efixmate\Domain\Models\CustomerSession;
use Illuminate\Http\Request;

class CustomerOtpController extends Controller
{
    public function __construct(private SmsGateway $sms) {}

    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'mobile_number' => ['required', 'string', 'max:15'],
        ]);

        $otp = (string) random_int(100000, 999999);
        $customer = Customer::where('mobile_number', $data['mobile_number'])->first();

        CustomerLoginOtp::create([
            'customer_id' => $customer?->customer_id,
            'mobile_number' => $data['mobile_number'],
            'otp' => $otp,
            'ip_address' => $request->ip(),
            'is_registered' => (bool) $customer,
            'generated_at' => now(),
            'expired_at' => now()->addMinutes(5),
            'created_at' => now(),
            'created_by' => 'system',
            'attempts' => 0,
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

        $record = CustomerLoginOtp::where('mobile_number', $data['mobile_number'])
            ->orderByDesc('login_id')
            ->first();

        abort_unless($record, 422, 'No OTP request found for this number.');
        abort_if($record->attempts >= 5, 422, 'Too many attempts.');
        abort_if(now()->greaterThan($record->expired_at), 422, 'OTP expired.');

        if ($record->otp !== (int) $data['otp']) {
            $record->increment('attempts');
            abort(422, 'Invalid OTP.');
        }

        $customer = Customer::where('mobile_number', $data['mobile_number'])->first();
        $isNew = ! $customer;

        if ($isNew) {
            $customer = Customer::create([
                'customer_uid' => (string) str()->uuid(),
                'first_name' => 'New',
                'last_name' => 'Customer',
                'mobile_number' => $data['mobile_number'],
                'mobile_verified' => true,
                'is_active' => true,
                'created_by' => 'system',
                'created_at' => now(),
            ]);
        } else {
            $customer->forceFill(['mobile_verified' => true])->save();
        }

        $record->update(['customer_id' => $customer->customer_id, 'is_registered' => true]);

        $token = $customer->createToken('customer-api')->plainTextToken;

        CustomerSession::create([
            'customer_id' => $customer->customer_id,
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
            'customer' => $customer,
        ]);
    }
}
