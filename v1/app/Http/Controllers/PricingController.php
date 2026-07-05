<?php

namespace App\Http\Controllers;

use App\Services\Pricing\PricingEngineStub;
use Illuminate\Http\Request;

/**
 * Direct port of server/src/modules/pricing/routes/pricing.routes.js — the central
 * pricing engine, called internally by booking/cart flows and exposed here for
 * direct admin/debug use. Backed by PricingEngineStub (see its docblock — the real
 * area/slot/surge/discount rule-matching engine is deferred; this returns the same
 * fallback shape every caller already treats as the contract).
 */
class PricingController extends Controller
{
    public function __construct(private PricingEngineStub $engine) {}

    /** POST /api/pricing/calculate */
    public function calculate(Request $request)
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer'],
            'area_id' => ['nullable', 'integer'],
            'slot_id' => ['nullable', 'integer'],
            'scheduled_at' => ['nullable', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'slot_surge_multiplier' => ['nullable', 'numeric'],
        ]);

        $result = $this->engine->calculate($data['service_id'], [
            'areaId' => $data['area_id'] ?? null, 'slotId' => $data['slot_id'] ?? null,
            'scheduledAt' => $data['scheduled_at'] ?? null, 'quantity' => $data['quantity'] ?? 1,
            'slotSurgeMultiplier' => $data['slot_surge_multiplier'] ?? 1,
        ]);

        return response()->json(['status' => true, 'data' => $result]);
    }
}
