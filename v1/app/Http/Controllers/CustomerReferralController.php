<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\Request;

/** Direct port of the /user/referral* handlers in server/src/modules/user/routes/user.routes.js. */
class CustomerReferralController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    /** GET /api/user/referral */
    public function show(Request $request)
    {
        $customerId = $request->user()->customer_id;

        $code = $this->referrals->getOrCreateCode($customerId, 'CUSTOMER');
        $config = $this->referrals->getConfig();
        $stats = $this->referrals->getStats($customerId, 'CUSTOMER');

        return response()->json(['status' => true, 'data' => [
            'referral_code' => $code,
            'config' => [
                'enabled' => $config['user_enabled'],
                'referrer_reward' => $config['user_referrer_reward'],
                'referred_reward' => $config['user_referred_reward'],
                'trigger' => $config['trigger'],
            ],
            'stats' => $stats,
        ]]);
    }

    /** POST /api/user/referral/apply */
    public function apply(Request $request)
    {
        $data = $request->validate(['referral_code' => ['required', 'string']]);
        $customerId = $request->user()->customer_id;

        $result = $this->referrals->applyCode($data['referral_code'], $customerId, 'CUSTOMER', $request->ip());
        abort_if(isset($result['error']), 400, $result['error'] ?? 'Unable to apply referral code');

        return response()->json(['status' => true, 'message' => 'Referral code applied!', 'data' => $result]);
    }
}
