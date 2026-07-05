<?php

namespace App\Support;

use Efixmate\Domain\Models\MstrArea;

/**
 * Direct port of server/src/utils/geo.js + server/src/modules/user/lib/customerArea.js's
 * resolveAreaIdFromCoordinates/isPointInArea/isPointInPolygon/haversineDistanceKm. When
 * multiple active areas contain a point, the one whose centre is closest wins.
 */
class GeoAreaResolver
{
    private const EARTH_RADIUS_KM = 6371;

    public static function haversineDistanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * self::EARTH_RADIUS_KM * atan2(sqrt($a), sqrt(1 - $a));
    }

    private static function normalizePolygonCoordinates(mixed $polygonCoordinates): ?array
    {
        if (! $polygonCoordinates) {
            return null;
        }

        $parsed = is_string($polygonCoordinates) ? json_decode($polygonCoordinates, true) : $polygonCoordinates;
        if (! is_array($parsed)) {
            return null;
        }

        $isGeoJson = ($parsed['type'] ?? null) === 'Polygon';
        $ring = $parsed['coordinates'][0][0] ?? null;
        $ring = is_array($ring) ? $parsed['coordinates'][0] : ($parsed['coordinates'] ?? $parsed);

        if (! is_array($ring) || count($ring) < 3) {
            return null;
        }

        return array_map(function ($point) use ($isGeoJson) {
            if (is_array($point) && array_is_list($point)) {
                return $isGeoJson
                    ? ['lat' => (float) $point[1], 'lng' => (float) $point[0]]
                    : ['lat' => (float) $point[0], 'lng' => (float) $point[1]];
            }
            if (is_array($point)) {
                return [
                    'lat' => (float) ($point['lat'] ?? $point['latitude'] ?? 0),
                    'lng' => (float) ($point['lng'] ?? $point['longitude'] ?? 0),
                ];
            }
            throw new \InvalidArgumentException('polygon point must be [lat,lng] or {lat,lng}');
        }, $ring);
    }

    public static function isPointInPolygon(float $lat, float $lng, mixed $polygonCoordinates): bool
    {
        $polygon = self::normalizePolygonCoordinates($polygonCoordinates);
        if (! $polygon) {
            return false;
        }

        $inside = false;
        $count = count($polygon);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $current = $polygon[$i];
            $previous = $polygon[$j];
            $intersects = ($current['lng'] > $lng) !== ($previous['lng'] > $lng)
                && $lat < ($previous['lat'] - $current['lat']) * ($lng - $current['lng']) / ($previous['lng'] - $current['lng']) + $current['lat'];

            if ($intersects) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    public static function isPointInArea(float $lat, float $lng, MstrArea $area): bool
    {
        if ($area->polygon_coordinates) {
            try {
                if (self::isPointInPolygon($lat, $lng, $area->polygon_coordinates)) {
                    return true;
                }
            } catch (\Throwable) {
                // Malformed polygon — fall through to radius check.
            }
        }

        $cLat = (float) $area->latitude;
        $cLng = (float) $area->longitude;
        $radius = (float) $area->radius_km;
        if (! $radius || $radius <= 0) {
            return false;
        }

        return self::haversineDistanceKm($lat, $lng, $cLat, $cLng) <= $radius;
    }

    public static function resolveAreaIdFromCoordinates(?float $lat, ?float $lng): ?int
    {
        if ($lat === null || $lng === null || ! is_finite($lat) || ! is_finite($lng)) {
            return null;
        }

        $areas = MstrArea::where('is_active', true)->orderBy('area_id')->get();

        $bestId = null;
        $bestDist = INF;
        foreach ($areas as $area) {
            if (! self::isPointInArea($lat, $lng, $area)) {
                continue;
            }
            $cLat = (float) $area->latitude;
            $cLng = (float) $area->longitude;
            $dist = self::haversineDistanceKm($lat, $lng, $cLat, $cLng);
            if ($dist < $bestDist) {
                $bestDist = $dist;
                $bestId = (int) $area->area_id;
            }
        }

        return $bestId;
    }

    /** Prefer a stored area_id on the address row, else resolve from its coordinates. */
    public static function resolveAreaIdForAddress(?array $addr): ?int
    {
        if (! $addr) {
            return null;
        }

        $stored = isset($addr['area_id']) ? (int) $addr['area_id'] : null;
        if ($stored && $stored > 0) {
            return $stored;
        }

        $lat = isset($addr['latitude']) ? (float) $addr['latitude'] : null;
        $lng = isset($addr['longitude']) ? (float) $addr['longitude'] : null;
        if ($lat === null || $lng === null) {
            return null;
        }

        return self::resolveAreaIdFromCoordinates($lat, $lng);
    }
}
