<?php

namespace App\Http\Controllers;

use App\Support\GeoAreaResolver;
use Efixmate\Domain\Models\MstrArea;
use Efixmate\Domain\Models\Technician;
use Efixmate\Domain\Models\TechnicianLiveLocation;
use Illuminate\Http\Request;

/**
 * Direct port of server/src/modules/technician/routes/geo.routes.js (3 endpoints),
 * internal-API-key-gated per internalApiKey.middleware.js.
 */
class GeoController extends Controller
{
    /** POST /api/geo/areas */
    public function storeArea(Request $request)
    {
        $data = $request->validate([
            'area_name' => ['required', 'string'], 'city_id' => ['required', 'integer'],
            'area_type_id' => ['nullable', 'integer'], 'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'], 'radius_km' => ['nullable', 'numeric'],
            'polygon_coordinates' => ['nullable', 'array'],
        ]);
        $area = MstrArea::create(array_merge($data, ['is_active' => true, 'created_by' => 'internal', 'created_at' => now()]));

        return response()->json(['status' => true, 'message' => 'Area created', 'data' => $area], 201);
    }

    /** GET /api/geo/areas */
    public function listAreas()
    {
        return response()->json(['status' => true, 'data' => MstrArea::where('is_active', true)->get()]);
    }

    /** POST /api/geo/assign-technician — nearest-technician resolver. */
    public function assignTechnician(Request $request)
    {
        $data = $request->validate(['latitude' => ['required', 'numeric'], 'longitude' => ['required', 'numeric'], 'radius_km' => ['nullable', 'numeric']]);
        $radiusKm = min(50, (float) ($data['radius_km'] ?? 10));

        $nearest = TechnicianLiveLocation::query()->get()
            ->map(function ($loc) use ($data) {
                return ['technician_id' => $loc->technician_id, 'distance_km' => GeoAreaResolver::haversineDistanceKm((float) $loc->lat, (float) $loc->lng, (float) $data['latitude'], (float) $data['longitude'])];
            })
            ->filter(fn ($row) => $row['distance_km'] <= $radiusKm)
            ->sortBy('distance_km')->values()->first();

        abort_if(! $nearest, 404, 'No technician within range');

        $technician = Technician::where('technician_id', $nearest['technician_id'])->where('is_online', true)->where('is_active', true)->first();
        abort_if(! $technician, 404, 'Nearest technician is not currently available');

        return response()->json(['status' => true, 'data' => [
            'technician_id' => $technician->technician_id, 'distance_km' => round($nearest['distance_km'], 2),
        ]]);
    }
}
