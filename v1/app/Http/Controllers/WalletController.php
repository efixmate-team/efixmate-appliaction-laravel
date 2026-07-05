<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Direct port of server/src/modules/user/controller/walletUser.controller.js. */
class WalletController extends Controller
{
    /** GET /api/user/wallet */
    public function show(Request $request)
    {
        $customerId = $request->user()->customer_id;

        $balance = (float) (DB::table('efm_customer_wallet_ledger')
            ->where('customer_id', $customerId)
            ->orderByDesc('ledger_id')
            ->value('balance_after') ?? 0);

        $ledger = DB::table('efm_customer_wallet_ledger as wl')
            ->leftJoin('efm_bookings as b', 'b.booking_id', '=', 'wl.booking_id')
            ->where('wl.customer_id', $customerId)
            ->orderByDesc('wl.ledger_id')
            ->limit(30)
            ->select('wl.ledger_id', 'wl.entry_type', 'wl.amount', 'wl.balance_after', 'wl.meta', 'wl.created_at', 'wl.booking_id', 'b.booking_uid')
            ->get();

        return response()->json(['status' => true, 'data' => [
            'balance' => $balance,
            'transactions' => $ledger->map(fn ($t) => [
                'id' => (int) $t->ledger_id,
                'type' => $t->entry_type,
                'amount' => (float) $t->amount,
                'balance_after' => (float) $t->balance_after,
                'booking_id' => $t->booking_id ? (int) $t->booking_id : null,
                'booking_uid' => $t->booking_uid,
                'meta' => $t->meta ? json_decode($t->meta, true) : (object) [],
                'created_at' => $t->created_at,
            ]),
        ]]);
    }
}
