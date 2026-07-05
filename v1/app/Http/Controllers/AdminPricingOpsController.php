<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminPricingConfigVersion;
use Illuminate\Http\Request;

/**
 * Direct port of the versioned dynamic/surge/peak-hours/emergency/commission
 * pricing-config writers in server/.../admin/pricingOps.routes.js (6 endpoints).
 */
class AdminPricingOpsController extends Controller
{
    private const TYPES = ['dynamic', 'surge', 'peak-hours', 'emergency', 'commission'];

    /** GET /api/admin/pricing-ops/{type} */
    public function show(string $type, Request $request)
    {
        abort_unless(in_array($type, self::TYPES, true), 404, 'Unknown pricing config type');
        $query = AdminPricingConfigVersion::where('config_type', $type)->where('is_active', true);
        if ($request->filled('area_id')) $query->where('area_id', $request->query('area_id'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('version_no')->first()]);
    }

    /** GET /api/admin/pricing-ops/{type}/versions */
    public function versions(string $type, Request $request)
    {
        abort_unless(in_array($type, self::TYPES, true), 404, 'Unknown pricing config type');
        $query = AdminPricingConfigVersion::where('config_type', $type);
        if ($request->filled('area_id')) $query->where('area_id', $request->query('area_id'));

        return response()->json(['status' => true, 'data' => $query->orderByDesc('version_no')->get()]);
    }

    /** POST /api/admin/pricing-ops/{type} */
    public function store(string $type, Request $request)
    {
        abort_unless(in_array($type, self::TYPES, true), 404, 'Unknown pricing config type');
        $data = $request->validate(['area_id' => ['nullable', 'integer'], 'config' => ['required', 'array']]);

        $lastVersion = (int) AdminPricingConfigVersion::where('config_type', $type)
            ->where('area_id', $data['area_id'] ?? null)->max('version_no');

        AdminPricingConfigVersion::where('config_type', $type)->where('area_id', $data['area_id'] ?? null)
            ->update(['is_active' => false]);

        $version = AdminPricingConfigVersion::create([
            'config_type' => $type, 'area_id' => $data['area_id'] ?? null, 'config' => $data['config'],
            'version_no' => $lastVersion + 1, 'is_active' => true,
            'created_by' => $request->user()->admin_id, 'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Pricing config version created', 'data' => $version], 201);
    }
}
