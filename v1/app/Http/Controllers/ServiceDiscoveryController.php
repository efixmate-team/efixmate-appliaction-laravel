<?php

namespace App\Http\Controllers;

use App\Support\GeoAreaResolver;
use App\Support\PublicUrlResolver;
use Efixmate\Domain\Models\AreaServiceMapping;
use Efixmate\Domain\Models\AreaServicePricing;
use Efixmate\Domain\Models\CustomerAddress;
use Efixmate\Domain\Models\LkpBookingType;
use Efixmate\Domain\Models\LkpUnit;
use Efixmate\Domain\Models\MapAreaServiceBookingType;
use Efixmate\Domain\Models\MapAreaServiceUnit;
use Efixmate\Domain\Models\MstrService;
use Efixmate\Domain\Models\MstrServiceCategory;
use Efixmate\Domain\Models\MstrTimeSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of server/src/modules/user/controller/services.controller.js (home
 * categories, service-type lists, search, serviceability check) plus the
 * area-scoped catalog endpoints from user.controller.js (getAreaBasedServiceCategory
 * / getAreaBasedServiceList).
 */
class ServiceDiscoveryController extends Controller
{
    /** GET /api/user/service-category/home */
    public function homeCategories()
    {
        $rows = MstrServiceCategory::where('is_active', true)
            ->orderBy('order_seq')->orderBy('category_id')
            ->limit(7)->get();

        $result = $rows->map(fn ($c) => [
            'id' => $c->category_id,
            'title' => $c->category_name,
            'subtitle' => $c->description,
            'icon' => $c->category_icon,
            'color' => $c->category_color,
            'is_more' => false,
            'action' => ['type' => 'OPEN_CATEGORY', 'value' => (string) $c->category_id],
        ])->push([
            'id' => null, 'title' => 'More Services', 'subtitle' => 'And many more',
            'icon' => null, 'color' => '#4E4848', 'is_more' => true,
            'action' => ['type' => '/MoreServicesPage', 'value' => ''],
        ]);

        return response()->json(['status' => true, 'result' => $result->values(), 'message' => 'ok']);
    }

    /** POST /api/user/services/details */
    public function serviceDetails(Request $request)
    {
        $data = $request->validate(['service_id' => ['required', 'integer']]);
        $row = MstrService::find($data['service_id']);
        abort_if(! $row, 404, 'Service not found');

        $price = $row->base_price !== null ? (float) $row->base_price : 0;

        return response()->json(['status' => true, 'data' => array_merge($row->toArray(), [
            'title' => $row->service,
            'price' => $price,
            'image_url' => PublicUrlResolver::resolve($request, $row->image_url),
            'service_icon' => PublicUrlResolver::resolve($request, $row->service_icon),
            'image' => PublicUrlResolver::resolve($request, $row->image_url ?? $row->service_icon),
        ])]);
    }

    /** GET /api/user/service_search */
    public function search(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(50, max(1, (int) $request->query('limit', 10)));
        $offset = ($page - 1) * $limit;
        $search = trim((string) ($request->query('search') ?? $request->query('q') ?? ''));

        $query = MstrService::query()->where('is_active', true);
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('service', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $total = (clone $query)->count();

        if ($search !== '') {
            $query->orderByRaw("CASE WHEN service LIKE ? THEN 0 ELSE 1 END", ["{$search}%"]);
        } else {
            $query->orderBy('category_id')->orderBy('order_seq');
        }
        $rows = $query->orderBy('service_id')->offset($offset)->limit($limit)->get();

        $areaId = null;
        $customer = $request->user();
        if ($customer) {
            $addr = CustomerAddress::where('customer_id', $customer->customer_id)
                ->where('is_active', true)->orderByDesc('is_selected')->orderByDesc('address_id')->first();
            if ($addr) {
                $areaId = GeoAreaResolver::resolveAreaIdForAddress($addr->toArray());
            }
        }

        $normalized = $this->normalizeServiceList($request, $rows, $areaId);

        return response()->json(['status' => true, 'result' => [
            'data' => $normalized,
            'pagination' => [
                'total' => $total,
                'count' => $normalized->count(),
                'per_page' => $limit,
                'current_page' => $page,
                'last_pages' => max(1, (int) ceil($total / $limit)),
            ],
        ]]);
    }

    /** GET /api/user/check-serviceability */
    public function checkServiceability(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if (! is_numeric($lat) || ! is_numeric($lng)) {
            return response()->json(['status' => true, 'serviceable' => true, 'area_id' => null]);
        }

        try {
            $areaId = GeoAreaResolver::resolveAreaIdFromCoordinates((float) $lat, (float) $lng);
        } catch (\Throwable) {
            return response()->json(['status' => true, 'serviceable' => true, 'area_id' => null]);
        }

        return response()->json(['status' => true, 'serviceable' => $areaId !== null, 'area_id' => $areaId]);
    }

    /** GET /api/user/services/popular */
    public function popular(Request $request)
    {
        $rows = DB::table('efm_mstr_services as s')
            ->leftJoinSub(
                DB::table('efm_booking_lines')->select('service_id', DB::raw('COUNT(*) as booking_count'))->groupBy('service_id'),
                'bc', 's.service_id', '=', 'bc.service_id'
            )
            ->select('s.service_id', 's.service as title', 's.service_icon', 's.image_url', 's.base_price',
                DB::raw("COALESCE(s.service_color,'#1565C0') as color"), DB::raw('COALESCE(bc.booking_count,0) as booking_count'))
            ->where('s.is_active', true)
            ->orderByDesc(DB::raw('COALESCE(bc.booking_count,0)'))->orderBy('s.service_id')
            ->limit(8)->get();

        $result = $rows->map(fn ($r) => [
            'service_id' => $r->service_id, 'title' => $r->title,
            'image' => PublicUrlResolver::resolve($request, $r->image_url ?? $r->service_icon),
            'price' => $r->base_price !== null ? (float) $r->base_price : null,
            'color' => $r->color, 'booking_count' => (int) $r->booking_count,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    private function flagList(Request $request, string $column, string $flagKey, string $defaultColor): \Illuminate\Http\JsonResponse
    {
        $rows = MstrService::where('is_active', true)->where($column, true)
            ->orderBy('service_id')->limit(10)->get();

        $result = $rows->map(fn ($r) => [
            'service_id' => $r->service_id, 'title' => $r->service,
            'image' => PublicUrlResolver::resolve($request, $r->image_url ?? $r->service_icon),
            'price' => $r->base_price !== null ? (float) $r->base_price : null,
            'color' => $r->service_color ?: $defaultColor,
            $flagKey => true,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    /** GET /api/user/services/emergency */
    public function emergency(Request $request)
    {
        $slotServiceIds = MstrTimeSlot::where('is_instant', true)->where('is_active', true)->pluck('service_id');

        $rows = MstrService::where('is_active', true)
            ->where(function ($q) use ($slotServiceIds) {
                $q->where('is_emergency', true)->orWhereIn('service_id', $slotServiceIds);
            })
            ->orderBy('service_id')->limit(10)->get();

        $result = $rows->map(fn ($r) => [
            'service_id' => $r->service_id, 'title' => $r->service,
            'image' => PublicUrlResolver::resolve($request, $r->image_url ?? $r->service_icon),
            'price' => $r->base_price !== null ? (float) $r->base_price : null,
            'color' => $r->service_color ?: '#D32F2F',
            'is_emergency' => true,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    /** GET /api/user/services/quick */
    public function quick(Request $request)
    {
        return $this->flagList($request, 'is_quick_service', 'is_quick_service', '#1976D2');
    }

    /** GET /api/user/services/instant */
    public function instant(Request $request)
    {
        return $this->flagList($request, 'is_instant_service', 'is_instant_service', '#388E3C');
    }

    /** GET /api/user/services/one-click */
    public function oneClick(Request $request)
    {
        return $this->flagList($request, 'is_one_click_service', 'is_one_click_service', '#7B1FA2');
    }

    /** GET /api/user/services/{serviceId}/type-flags */
    public function typeFlags(int $serviceId)
    {
        $r = MstrService::where('service_id', $serviceId)->where('is_active', true)->first();
        abort_if(! $r, 404, 'Service not found');

        return response()->json(['status' => true, 'data' => [
            'service_id' => $r->service_id,
            'title' => $r->service,
            'is_emergency' => (bool) $r->is_emergency,
            'is_quick_service' => (bool) $r->is_quick_service,
            'is_instant_service' => (bool) $r->is_instant_service,
            'is_one_click_service' => (bool) $r->is_one_click_service,
        ]]);
    }

    /** GET /api/user/services/categories */
    public function areaBasedCategories(Request $request)
    {
        $customerId = $request->user()?->customer_id;
        abort_unless($customerId, 403, 'Unauthorized');

        $addr = $this->loadAddress($customerId);
        abort_if(! $addr, 400, 'Add a service address to view services in your area.');

        $areaId = GeoAreaResolver::resolveAreaIdForAddress($addr);
        if (! $areaId) {
            return response()->json(['status' => true, 'result' => []]);
        }

        $serviceIds = $this->activeServiceIdsForAreaTimeSlots($areaId);
        if (empty($serviceIds)) {
            return response()->json(['status' => true, 'result' => []]);
        }

        $rows = DB::table('efm_mstr_service_category as c')
            ->join('efm_mstr_services as s', 's.category_id', '=', 'c.category_id')
            ->join('efm_area_service_mapping as m', function ($j) use ($areaId) {
                $j->on('m.service_id', '=', 's.service_id')->where('m.area_id', $areaId);
            })
            ->whereIn('s.service_id', $serviceIds)
            ->where('c.is_active', true)
            ->select('c.category_id', 'c.order_seq', 'c.category_name', 'c.category_icon', 'c.category_color', 'c.description', 'c.is_active')
            ->distinct()
            ->orderBy('c.order_seq')->orderBy('c.category_id')
            ->get();

        $result = $rows->map(fn ($r) => [
            'category_id' => $r->category_id,
            'order_seq' => $r->order_seq,
            'category_name' => $r->category_name,
            'category_icon' => PublicUrlResolver::resolve($request, $r->category_icon),
            'category_color' => $r->category_color,
            'description' => $r->description,
            'is_active' => (bool) $r->is_active,
        ]);

        return response()->json(['status' => true, 'result' => $result]);
    }

    /** GET /api/user/services/list */
    public function areaBasedServiceList(Request $request)
    {
        $customerId = $request->user()?->customer_id;
        abort_unless($customerId, 403, 'Unauthorized');

        $categoryId = $request->query('category_id') ?? $request->query('categoryId');
        abort_unless(is_numeric($categoryId), 400, 'category_id is required');
        $categoryId = (int) $categoryId;

        $addr = $this->loadAddress($customerId);
        abort_if(! $addr, 400, 'Add a service address to view services in your area.');

        $areaId = GeoAreaResolver::resolveAreaIdForAddress($addr);
        abort_if(! $areaId, 400, 'Selected address has no service area assigned.');

        $category = MstrServiceCategory::where('category_id', $categoryId)->first();

        $rows = DB::table('efm_mstr_services as s')
            ->join('efm_area_service_mapping as m', function ($j) use ($areaId) {
                $j->on('m.service_id', '=', 's.service_id')->where('m.area_id', $areaId)->where('m.is_active', true);
            })
            ->where('s.category_id', $categoryId)
            ->where('s.is_active', true)
            ->select('s.*')
            ->distinct()
            ->orderBy('s.service_id')->orderBy('s.order_seq')
            ->get();

        $normalized = $this->normalizeServiceList($request, $rows, $areaId);

        return response()->json([
            'status' => true,
            'message' => 'ok',
            'category' => $category ? [
                'category_id' => $category->category_id,
                'category_name' => $category->category_name,
                'category_icon' => PublicUrlResolver::resolve($request, $category->category_icon),
                'category_color' => $category->category_color,
            ] : ['category_id' => $categoryId],
            'result' => $normalized,
            'area_id' => $areaId,
        ]);
    }

    /** @return array|null associative array of the customer's active address, selected first */
    private function loadAddress(int $customerId): ?array
    {
        $addr = CustomerAddress::where('customer_id', $customerId)
            ->where('is_active', true)
            ->orderByDesc('is_selected')->orderByDesc('address_id')
            ->first();

        return $addr?->toArray();
    }

    private function activeServiceIdsForAreaTimeSlots(int $areaId): array
    {
        $slots = MstrTimeSlot::where('area_id', $areaId)->where('is_active', true)->whereNotNull('service_id')->get();
        $now = now('Asia/Kolkata');
        $nowMinutes = ((int) $now->format('H')) * 60 + (int) $now->format('i');

        $ids = [];
        foreach ($slots as $slot) {
            if ($this->isWithinSlot($slot->start_time, $slot->end_time, $nowMinutes)) {
                $ids[$slot->service_id] = true;
            }
        }

        return array_keys($ids);
    }

    private function isWithinSlot(?string $start, ?string $end, int $nowMinutes): bool
    {
        if (! preg_match('/^(\d{1,2}):(\d{2})/', (string) $start, $s) || ! preg_match('/^(\d{1,2}):(\d{2})/', (string) $end, $e)) {
            return false;
        }
        $startMin = ((int) $s[1]) * 60 + (int) $s[2];
        $endMin = ((int) $e[1]) * 60 + (int) $e[2];

        return $startMin <= $endMin
            ? $nowMinutes >= $startMin && $nowMinutes <= $endMin
            : $nowMinutes >= $startMin || $nowMinutes <= $endMin;
    }

    /**
     * Direct (simplified) port of buildNormalizedServiceList. The full deprecated
     * pricing-rule engine (RULE_TYPE.AREA REPLACE rules + surge calc) is deferred to
     * Stage 8; here an active efm_area_service_pricing row stands in for it, else
     * falling back to the service's catalog base_price when an area is known. With
     * no area at all, price/base_price come out null — matching Node's own behavior.
     */
    private function normalizeServiceList(Request $request, $rows, ?int $areaId): \Illuminate\Support\Collection
    {
        $serviceIds = collect($rows)->pluck('service_id')->unique()->values()->all();
        if (empty($serviceIds)) {
            return collect();
        }

        $mappedBookingTypes = [];
        $mappedUnits = [];
        if ($areaId) {
            foreach (MapAreaServiceBookingType::whereIn('service_id', $serviceIds)->where('area_id', $areaId)->where('is_active', true)->get() as $m) {
                $bt = LkpBookingType::find($m->booking_type_id);
                $mappedBookingTypes[$m->service_id][] = ['id' => $m->booking_type_id, 'name' => $bt?->booking_type];
            }
            foreach (MapAreaServiceUnit::whereIn('service_id', $serviceIds)->where('area_id', $areaId)->where('is_active', true)->get() as $m) {
                $u = LkpUnit::find($m->unit_id);
                $mappedUnits[$m->service_id][] = ['unit_id' => $m->unit_id, 'name' => $u?->unit_name, 'type' => $u?->unit_symbol ?: '', 'price_per_unit' => $m->price_per_unit];
            }
        }

        $priceOverrides = [];
        if ($areaId) {
            foreach (AreaServicePricing::where('area_id', $areaId)->whereIn('service_id', $serviceIds)->where('is_active', true)->get() as $p) {
                $priceOverrides[$p->service_id] = (float) $p->final_price;
            }
        }

        $bookingTypeCache = LkpBookingType::pluck('booking_type', 'booking_type_id');
        $unitCache = LkpUnit::all()->keyBy('unit_id');

        $seen = [];
        $out = collect();
        foreach ($rows as $item) {
            $serviceId = $item->service_id;
            if (isset($seen[$serviceId])) {
                continue;
            }
            $seen[$serviceId] = true;

            $baseBookingTypes = collect(is_string($item->booking_type_ids ?? null) ? json_decode($item->booking_type_ids, true) : ($item->booking_type_ids ?? []))
                ->map(fn ($id) => ['id' => (int) $id, 'name' => $bookingTypeCache[(int) $id] ?? null])->values()->all();
            $baseUnits = collect(is_string($item->unit_ids ?? null) ? json_decode($item->unit_ids, true) : ($item->unit_ids ?? []))
                ->map(function ($id) use ($unitCache) {
                    $u = $unitCache->get((int) $id);

                    return ['unit_id' => (int) $id, 'name' => $u?->unit_name, 'type' => $u?->unit_symbol ?: ''];
                })->values()->all();

            $servicePrice = $priceOverrides[$serviceId] ?? ($areaId ? (float) ($item->base_price ?? 0) : null);

            $out->push([
                'service_id' => $serviceId,
                'title' => $item->service ?? '',
                'service_icon' => PublicUrlResolver::resolve($request, $item->service_icon ?? $item->image_url ?? null),
                'image' => PublicUrlResolver::resolve($request, $item->image_url ?? $item->service_icon ?? null),
                'rating' => (float) ($item->avg_rating ?? 0),
                'duration_minutes' => $item->duration ?? null,
                'price' => $servicePrice,
                'base_price' => $servicePrice,
                'booking_types' => $mappedBookingTypes[$serviceId] ?? $baseBookingTypes,
                'units' => $mappedUnits[$serviceId] ?? $baseUnits,
                'area_id' => $areaId,
                'is_emergency' => (bool) ($item->is_emergency ?? false),
                'quantity_required' => ! empty($mappedUnits[$serviceId] ?? $baseUnits),
                'has_unit' => ! empty($mappedUnits[$serviceId] ?? $baseUnits),
                'detailed_description' => $item->description ?? null,
            ]);
        }

        return $out;
    }
}
