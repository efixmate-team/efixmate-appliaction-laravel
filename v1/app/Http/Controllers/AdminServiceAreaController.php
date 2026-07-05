<?php

namespace App\Http\Controllers;

use App\Support\GeoAreaResolver;
use Efixmate\Domain\Models\AdminZonePolygon;
use Efixmate\Domain\Models\MstrArea;
use Illuminate\Http\Request;

/**
 * Bespoke service-area endpoints beyond the generic /master/areas CRUD:
 * zone-polygon management and a coverage check.
 */
class AdminServiceAreaController extends Controller
{
    /** GET /api/admin/service-areas/zones */
    public function zones(Request $request)
    {
        $query = AdminZonePolygon::query();
        if ($request->filled('area_id')) {
            $query->where('area_id', $request->query('area_id'));
        }

        return response()->json(['status' => true, 'data' => $query->where('is_active', true)->get()]);
    }

    /** POST /api/admin/service-areas/zones */
    public function storeZone(Request $request)
    {
        $data = $request->validate([
            'area_id' => ['required', 'integer'],
            'zone_name' => ['required', 'string'],
            'polygon' => ['required', 'array'],
        ]);
        $zone = AdminZonePolygon::create(array_merge($data, ['is_active' => true, 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Zone created', 'data' => $zone], 201);
    }

    /** DELETE /api/admin/service-areas/zones/{id} */
    public function destroyZone(int $id)
    {
        AdminZonePolygon::where('zone_id', $id)->update(['is_active' => false, 'is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Zone deleted']);
    }

    /** GET /api/admin/service-areas/coverage-check */
    public function coverageCheck(Request $request)
    {
        $data = $request->validate(['lat' => ['required', 'numeric'], 'lng' => ['required', 'numeric']]);
        $areaId = GeoAreaResolver::resolveAreaIdFromCoordinates((float) $data['lat'], (float) $data['lng']);

        return response()->json(['status' => true, 'data' => [
            'covered' => $areaId !== null, 'area_id' => $areaId,
            'area' => $areaId ? MstrArea::find($areaId) : null,
        ]]);
    }

    /** GET /api/admin/service-areas/stats */
    public function stats()
    {
        return response()->json(['status' => true, 'data' => [
            'total_areas' => MstrArea::count(),
            'active_areas' => MstrArea::where('is_active', true)->count(),
        ]]);
    }
}
