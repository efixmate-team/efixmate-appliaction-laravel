<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Generic config-driven CRUD engine — direct port of
 * server/src/modules/masters/controller/master.controller.js. One engine, 25
 * resources (v1/config/master_resources.php). Unlike LookupCrudController, this
 * one applies per-resource LEFT JOIN enrichment (applyJoins) and, for 'countries'
 * and 'services', extra post-fetch label hydration + (for 'services') a
 * transactional coupon/discount mapping sync — mirroring the Node code exactly.
 *
 * Deliberately NOT ported: Node's lazy schema-migration helpers (ensureCountryColumns,
 * ensureServiceColumns, ensureTimeSlotSchema, ensurePromotionsColumns) — those exist
 * in Node only to patch a schema that's already correct in our generated migrations.
 *
 * NOTE on parameter order: Laravel binds untyped/scalar controller parameters
 * positionally against $route->parameters(), which places real URI segments
 * (e.g. {id}) before Route::defaults() values (e.g. our 'resource' key) —
 * regardless of the order defaults() was called. So methods on routes with
 * both a real {id} and a resource default must declare $id before $resource,
 * or the two get silently swapped.
 */
class MasterCrudController extends Controller
{
    private function config(string $resource): array
    {
        $cfg = config("master_resources.$resource");
        abort_if($cfg === null, 404, 'Master resource not found');

        return $cfg;
    }

    private function applyJoins(string $resource, Builder $query): void
    {
        match ($resource) {
            'states' => $query->select('efm_mstr_states.*', 'efm_mstr_countries.country_name')
                ->leftJoin('efm_mstr_countries', 'efm_mstr_states.country_id', '=', 'efm_mstr_countries.country_id'),
            'cities' => $query->select('efm_mstr_cities.*', 'efm_mstr_states.state_name', 'efm_mstr_states.country_id', 'efm_mstr_countries.country_name')
                ->leftJoin('efm_mstr_states', 'efm_mstr_cities.state_id', '=', 'efm_mstr_states.state_id')
                ->leftJoin('efm_mstr_countries', 'efm_mstr_states.country_id', '=', 'efm_mstr_countries.country_id'),
            'countries' => $query->select('efm_mstr_countries.*', 'efm_lkp_currencies.currency_name')
                ->leftJoin('efm_lkp_currencies', 'efm_mstr_countries.currency_id', '=', 'efm_lkp_currencies.currency_id'),
            'areas' => $query->select(
                'efm_mstr_areas.*',
                'efm_mstr_cities.city_name',
                'efm_mstr_cities.state_id',
                'efm_mstr_states.country_id',
                'efm_mstr_states.state_name',
                'efm_mstr_countries.country_name',
                'efm_lkp_area_type.area_type as area_type_name',
            )
                ->leftJoin('efm_mstr_cities', 'efm_mstr_areas.city_id', '=', 'efm_mstr_cities.city_id')
                ->leftJoin('efm_mstr_states', 'efm_mstr_cities.state_id', '=', 'efm_mstr_states.state_id')
                ->leftJoin('efm_mstr_countries', 'efm_mstr_states.country_id', '=', 'efm_mstr_countries.country_id')
                ->leftJoin('efm_lkp_area_type', 'efm_mstr_areas.area_type_id', '=', 'efm_lkp_area_type.area_type_id'),
            'services' => $query->select('efm_mstr_services.*', 'efm_mstr_service_category.category_name')
                ->leftJoin('efm_mstr_service_category', 'efm_mstr_services.category_id', '=', 'efm_mstr_service_category.category_id'),
            'service-pricing' => $query->select('efm_service_pricing.*', 'efm_mstr_services.service', 'efm_mstr_cities.city_name', 'efm_lkp_booking_type.booking_type')
                ->leftJoin('efm_mstr_services', 'efm_service_pricing.service_id', '=', 'efm_mstr_services.service_id')
                ->leftJoin('efm_mstr_cities', 'efm_service_pricing.city_id', '=', 'efm_mstr_cities.city_id')
                ->leftJoin('efm_lkp_booking_type', 'efm_service_pricing.booking_type_id', '=', 'efm_lkp_booking_type.booking_type_id'),
            'time-slots' => $query->select('efm_mstr_time_slots.*', 'efm_mstr_areas.area_name', 'efm_mstr_services.service')
                ->leftJoin('efm_mstr_areas', 'efm_mstr_time_slots.area_id', '=', 'efm_mstr_areas.area_id')
                ->leftJoin('efm_mstr_services', 'efm_mstr_time_slots.service_id', '=', 'efm_mstr_services.service_id'),
            'feedbacks' => $query->select('efm_feedbacks.*', 'efm_customers.first_name', 'efm_customers.last_name')
                ->leftJoin('efm_customers', 'efm_feedbacks.user_id', '=', 'efm_customers.customer_id'),
            'bookings' => $query->select(
                'efm_bookings.*',
                'efm_customers.first_name', 'efm_customers.last_name',
                'efm_mstr_services.service',
                'efm_technicians.first_name as tech_first_name', 'efm_technicians.last_name as tech_last_name',
                DB::raw("CASE efm_bookings.booking_status_id WHEN 1 THEN 'PENDING' WHEN 2 THEN 'CONFIRMED' WHEN 3 THEN 'IN PROGRESS' WHEN 4 THEN 'COMPLETED' WHEN 5 THEN 'CANCELLED' WHEN 6 THEN 'FAILED' WHEN 7 THEN 'REFUNDED' WHEN 20 THEN 'BROADCASTED' WHEN 21 THEN 'TECH ACCEPTED' WHEN 22 THEN 'ON THE WAY' WHEN 23 THEN 'ARRIVED' WHEN 24 THEN 'STARTED' WHEN 25 THEN 'NO SERVICE' ELSE 'UNKNOWN' END as booking_status"),
            )
                ->leftJoin('efm_customers', 'efm_bookings.customer_id', '=', 'efm_customers.customer_id')
                ->leftJoin('efm_mstr_services', 'efm_bookings.service_id', '=', 'efm_mstr_services.service_id')
                ->leftJoin('efm_technicians', 'efm_bookings.technician_id', '=', 'efm_technicians.technician_id'),
            'payments' => $query->select('efm_payment_orders.*', 'efm_bookings.booking_uid', 'efm_customers.first_name', 'efm_customers.last_name')
                ->leftJoin('efm_bookings', 'efm_payment_orders.booking_id', '=', 'efm_bookings.booking_id')
                ->leftJoin('efm_customers', 'efm_payment_orders.customer_id', '=', 'efm_customers.customer_id'),
            'invoices' => $query->select('efm_invoices.*', 'efm_bookings.booking_uid')
                ->leftJoin('efm_bookings', 'efm_invoices.booking_id', '=', 'efm_bookings.booking_id'),
            'payouts' => $query->select('efm_payouts.*', 'efm_technicians.first_name', 'efm_technicians.last_name')
                ->leftJoin('efm_technicians', 'efm_payouts.technician_id', '=', 'efm_technicians.technician_id'),
            'refunds' => $query->select('efm_refunds.*', 'efm_payment_orders.gateway_order_id')
                ->leftJoin('efm_payment_orders', 'efm_refunds.payment_id', '=', 'efm_payment_orders.order_id'),
            'referrals' => $query->select(
                'efm_referrals.*',
                DB::raw("CASE WHEN efm_referrals.referrer_type = 'CUSTOMER' THEN TRIM(BOTH ' ' FROM CONCAT(COALESCE(rfc.first_name, ''), ' ', COALESCE(rfc.last_name, ''))) WHEN efm_referrals.referrer_type = 'TECHNICIAN' THEN TRIM(BOTH ' ' FROM CONCAT(COALESCE(rft.first_name, ''), ' ', COALESCE(rft.last_name, ''))) ELSE '' END as referrer_name"),
                DB::raw("CASE WHEN efm_referrals.referred_type = 'CUSTOMER' THEN TRIM(BOTH ' ' FROM CONCAT(COALESCE(rdc.first_name, ''), ' ', COALESCE(rdc.last_name, ''))) WHEN efm_referrals.referred_type = 'TECHNICIAN' THEN TRIM(BOTH ' ' FROM CONCAT(COALESCE(rdt.first_name, ''), ' ', COALESCE(rdt.last_name, ''))) ELSE '' END as referred_name"),
            )
                ->leftJoin('efm_customers as rfc', fn ($j) => $j->on('efm_referrals.referrer_id', '=', 'rfc.customer_id')->where('efm_referrals.referrer_type', 'CUSTOMER'))
                ->leftJoin('efm_technicians as rft', fn ($j) => $j->on('efm_referrals.referrer_id', '=', 'rft.technician_id')->where('efm_referrals.referrer_type', 'TECHNICIAN'))
                ->leftJoin('efm_customers as rdc', fn ($j) => $j->on('efm_referrals.referred_id', '=', 'rdc.customer_id')->where('efm_referrals.referred_type', 'CUSTOMER'))
                ->leftJoin('efm_technicians as rdt', fn ($j) => $j->on('efm_referrals.referred_id', '=', 'rdt.technician_id')->where('efm_referrals.referred_type', 'TECHNICIAN')),
            default => null,
        };
    }

    /** @return int[] */
    private function parseIdArray(mixed $value): array
    {
        if (is_string($value)) {
            $trimmed = trim($value);
            if (str_starts_with($trimmed, '[')) {
                $decoded = json_decode($trimmed, true);
                $value = json_last_error() === JSON_ERROR_NONE ? $decoded : $trimmed;
            }
        }

        $raw = match (true) {
            is_array($value) => $value,
            $value === null || $value === '' => [],
            default => [$value],
        };

        $ids = [];
        foreach ($raw as $item) {
            $parts = is_string($item) ? explode(',', $item) : [$item];
            foreach ($parts as $p) {
                if (is_numeric($p)) $ids[(int) $p] = (int) $p;
            }
        }

        return array_values($ids);
    }

    private function normalizeJsonFields(string $resource, array &$payload): void
    {
        if ($resource === 'areas' && array_key_exists('polygon_coordinates', $payload) && $payload['polygon_coordinates'] !== null && ! is_string($payload['polygon_coordinates'])) {
            $payload['polygon_coordinates'] = json_encode($payload['polygon_coordinates']);
        }

        if ($resource === 'countries') {
            foreach (['timezone_ids', 'language_ids'] as $field) {
                if (! array_key_exists($field, $payload)) continue;
                if ($payload[$field] === null) {
                    $payload[$field] = '[]';
                } elseif (! is_string($payload[$field])) {
                    $payload[$field] = json_encode($this->parseIdArray($payload[$field]));
                }
            }
        }

        if ($resource === 'services') {
            foreach (['booking_type_ids', 'unit_ids', 'charge_ids'] as $field) {
                if (! array_key_exists($field, $payload)) continue;
                $val = $payload[$field];
                if ($val === null || $val === '') {
                    $payload[$field] = '[]';
                } elseif (! is_string($val)) {
                    $payload[$field] = json_encode($this->parseIdArray($val));
                } else {
                    $trimmed = trim($val);
                    $payload[$field] = str_starts_with($trimmed, '[') ? $trimmed : json_encode($this->parseIdArray($val));
                }
            }
        }
    }

    private function defaultMasterValue(string $field): mixed
    {
        return match ($field) {
            'order_seq' => 0,
            'current_jobs' => 0,
            'max_jobs' => 1,
            default => null,
        };
    }

    private function hydrateCountryRelations(object|array &$rows): void
    {
        $list = is_array($rows) ? $rows : [$rows];
        $timezoneIds = collect($list)->flatMap(fn ($r) => $this->parseIdArray($r->timezone_ids ?? null))->unique()->values()->all();
        $languageIds = collect($list)->flatMap(fn ($r) => $this->parseIdArray($r->language_ids ?? null))->unique()->values()->all();

        $timezoneNames = $timezoneIds
            ? DB::table('efm_lkp_timezones')->whereIn('timezone_id', $timezoneIds)->pluck('timezone_name', 'timezone_id')
            : collect();
        $languageNames = $languageIds
            ? DB::table('efm_lkp_languages')->whereIn('language_id', $languageIds)->pluck('language_name', 'language_id')
            : collect();

        foreach ($list as $row) {
            $tIds = $this->parseIdArray($row->timezone_ids ?? null);
            $lIds = $this->parseIdArray($row->language_ids ?? null);
            $row->timezone_ids = $tIds;
            $row->timezone_name = collect($tIds)->map(fn ($id) => $timezoneNames[$id] ?? null)->filter()->implode(', ');
            $row->language_ids = $lIds;
            $row->language_name = collect($lIds)->map(fn ($id) => $languageNames[$id] ?? null)->filter()->implode(', ');
        }
    }

    private function hydrateServiceRelations(object|array &$rows): void
    {
        $list = is_array($rows) ? $rows : [$rows];
        if (empty($list)) return;

        $serviceIds = collect($list)->pluck('service_id')->filter()->values()->all();
        $allBookingTypeIds = collect($list)->flatMap(fn ($r) => $this->parseIdArray($r->booking_type_ids ?? null))->unique()->values()->all();
        $allUnitIds = collect($list)->flatMap(fn ($r) => $this->parseIdArray($r->unit_ids ?? null))->unique()->values()->all();
        $allChargeIds = collect($list)->flatMap(fn ($r) => $this->parseIdArray($r->charge_ids ?? null))->unique()->values()->all();

        $btLabels = $allBookingTypeIds ? DB::table('efm_lkp_booking_type')->whereIn('booking_type_id', $allBookingTypeIds)->pluck('booking_type', 'booking_type_id') : collect();
        $unitLabels = $allUnitIds ? DB::table('efm_lkp_units')->whereIn('unit_id', $allUnitIds)->pluck('unit_name', 'unit_id') : collect();
        $chargeLabels = $allChargeIds ? DB::table('efm_mstr_charges')->whereIn('charge_id', $allChargeIds)->pluck('charge_name', 'charge_id') : collect();

        $coupons = $serviceIds
            ? DB::table('efm_map_coupon_service as m')->leftJoin('efm_mstr_coupons as c', 'c.coupon_id', '=', 'm.coupon_id')
                ->whereIn('m.service_id', $serviceIds)->where('m.is_active', true)
                ->select('m.service_id', 'm.coupon_id', 'c.coupon_code')->get()->groupBy('service_id')
            : collect();
        $discounts = $serviceIds
            ? DB::table('efm_map_discount_service as m')->leftJoin('efm_mstr_discounts as d', 'd.discount_id', '=', 'm.discount_id')
                ->whereIn('m.service_id', $serviceIds)->where('m.is_active', true)
                ->select('m.service_id', 'm.discount_id', 'd.discount_title')->get()->groupBy('service_id')
            : collect();

        foreach ($list as $row) {
            $bTypeIds = $this->parseIdArray($row->booking_type_ids ?? null);
            $uIds = $this->parseIdArray($row->unit_ids ?? null);
            $cIds = $this->parseIdArray($row->charge_ids ?? null);
            $cpns = $coupons->get($row->service_id, collect());
            $dscs = $discounts->get($row->service_id, collect());

            $row->booking_type_ids = $bTypeIds;
            $row->booking_types = collect($bTypeIds)->map(fn ($id) => $btLabels[$id] ?? null)->filter()->implode(', ');
            $row->unit_ids = $uIds;
            $row->units = collect($uIds)->map(fn ($id) => $unitLabels[$id] ?? null)->filter()->implode(', ');
            $row->charge_ids = $cIds;
            $row->charges = collect($cIds)->map(fn ($id) => $chargeLabels[$id] ?? null)->filter()->implode(', ');
            $row->coupon_ids = $cpns->pluck('coupon_id')->all();
            $row->coupons = $cpns->pluck('coupon_code')->filter()->implode(', ');
            $row->discount_ids = $dscs->pluck('discount_id')->all();
            $row->discounts = $dscs->pluck('discount_title')->filter()->implode(', ');
            $row->discount_id = $dscs->first()?->discount_id;
            $row->discount = $dscs->first()?->discount_title;
        }
    }

    /** @return array{bookingTypeIds: int[], unitIds: int[], chargeIds: int[], couponIds: int[], discountIds: int[]} */
    private function getServiceRelationIds(Request $request): array
    {
        return [
            'bookingTypeIds' => $this->parseIdArray($request->input('booking_type_ids', $request->input('booking_type_id'))),
            'unitIds' => $this->parseIdArray($request->input('unit_ids', $request->input('unit_id'))),
            'chargeIds' => $this->parseIdArray($request->input('charge_ids', $request->input('charge_id'))),
            'couponIds' => $this->parseIdArray($request->input('coupon_ids', $request->input('coupon_id'))),
            'discountIds' => $this->parseIdArray($request->input('discount_ids', $request->input('discount_id'))),
        ];
    }

    private function syncServiceMappings(int $serviceId, array $relations): void
    {
        DB::table('efm_map_coupon_service')->where('service_id', $serviceId)->delete();
        DB::table('efm_map_discount_service')->where('service_id', $serviceId)->delete();

        foreach ($relations['couponIds'] as $couponId) {
            DB::table('efm_map_coupon_service')->insert(['coupon_id' => $couponId, 'service_id' => $serviceId, 'is_active' => true, 'created_at' => now()]);
        }
        foreach ($relations['discountIds'] as $discountId) {
            DB::table('efm_map_discount_service')->insert(['discount_id' => $discountId, 'service_id' => $serviceId, 'is_active' => true, 'created_at' => now()]);
        }
    }

    private function applyAuditOnInsert(array $cfg, array &$payload, Request $request): void
    {
        if (! $cfg['audit_on_insert']) return;
        $payload['created_by'] = substr((string) ($request->user()?->admin_uid ?? 'ADM001'), 0, 12);
        $payload['created_at'] = now();
    }

    private function applyAuditOnUpdate(array $cfg, array &$payload, Request $request): void
    {
        if ($cfg['audit_on_update'] === 'full') {
            $payload['updated_by'] = substr((string) ($request->user()?->admin_uid ?? 'ADM001'), 0, 12);
            $payload['updated_at'] = now();
        } elseif ($cfg['audit_on_update'] === 'timestamp_only') {
            $payload['updated_at'] = now();
        }
    }

    public function index(Request $request, string $resource)
    {
        $cfg = $this->config($resource);
        $table = $cfg['table'];

        $applyFilters = function (Builder $query) use ($request, $cfg, $table, $resource) {
            $query->where("$table.is_deleted", false);
            foreach ($request->query() as $key => $value) {
                if (! in_array($key, ['page', 'limit', 'search', 'min_price', 'max_price'], true)) {
                    $query->where("$table.$key", $value);
                }
            }
            if ($resource === 'services') {
                if (is_numeric($request->query('min_price'))) $query->where("$table.base_price", '>=', (float) $request->query('min_price'));
                if (is_numeric($request->query('max_price'))) $query->where("$table.base_price", '<=', (float) $request->query('max_price'));
            }
        };

        $searchCol = $cfg['search_col'] ?? collect($cfg['insert_fields'])->first(fn ($f) => str_contains($f, 'name')) ?? $cfg['insert_fields'][0];

        $query = DB::table($table);
        $this->applyJoins($resource, $query);
        $applyFilters($query);
        if ($search = $request->query('search')) {
            $query->where($searchCol, 'like', "%{$search}%");
        }

        $totalQuery = DB::table($table);
        $applyFilters($totalQuery);
        if ($search) $totalQuery->where($searchCol, 'like', "%{$search}%");
        $total = $totalQuery->count();

        if (in_array('order_seq', $cfg['insert_fields'], true)) {
            $query->orderBy("$table.order_seq");
        } elseif (! empty($cfg['default_order_desc'])) {
            $query->orderByDesc("$table.{$cfg['id_col']}");
        } else {
            $query->orderBy("$table.{$cfg['id_col']}");
        }

        $limit = $request->query('limit');
        $page = (int) ($request->query('page') ?? 1);
        if ($limit && $limit !== 'all') {
            $query->limit((int) $limit)->offset(($page - 1) * (int) $limit);
        }

        $rows = $query->get()->all();
        if ($resource === 'countries') $this->hydrateCountryRelations($rows);
        elseif ($resource === 'services') $this->hydrateServiceRelations($rows);

        return response()->json([
            'status' => true,
            'data' => ApiResponseFilter::filter($rows, $cfg['id_col']),
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit === 'all' ? $total : (int) ($limit ?? 10)],
        ]);
    }

    public function show(string|int $id, string $resource)
    {
        $cfg = $this->config($resource);
        $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->where('is_deleted', false)->first();
        abort_if(! $row, 404, 'Record not found');

        if ($resource === 'countries') $this->hydrateCountryRelations($row);
        elseif ($resource === 'services') $this->hydrateServiceRelations($row);

        return response()->json(['status' => true, 'data' => ApiResponseFilter::filter($row, $cfg['id_col'])]);
    }

    public function store(Request $request, string $resource)
    {
        $cfg = $this->config($resource);

        $payload = [];
        foreach ($cfg['insert_fields'] as $field) {
            $val = $request->input($field);
            if ($val === 'true') $val = true;
            elseif ($val === 'false') $val = false;
            elseif ($val === '') $val = null;
            $payload[$field] = $val ?? $this->defaultMasterValue($field);
        }

        if ($resource === 'countries') {
            if ($request->input('timezone_ids') === null && $request->input('timezone_id') !== null) {
                $payload['timezone_ids'] = $request->input('timezone_id');
            }
            if ($request->input('language_ids') === null && $request->input('language_id') !== null) {
                $payload['language_ids'] = $request->input('language_id');
            }
        }

        $this->normalizeJsonFields($resource, $payload);

        if ($resource === 'users' && empty($payload['customer_uid'] ?? null)) {
            $payload['customer_uid'] = (string) Str::uuid();
        }

        $this->applyAuditOnInsert($cfg, $payload, $request);

        if ($resource === 'services') {
            $relations = $this->getServiceRelationIds($request);
            $id = DB::transaction(function () use ($cfg, $payload, $relations) {
                $id = DB::table($cfg['table'])->insertGetId($payload, $cfg['id_col']);
                $this->syncServiceMappings($id, $relations);

                return $id;
            });
            $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();
            $this->hydrateServiceRelations($row);
        } else {
            $id = DB::table($cfg['table'])->insertGetId($payload, $cfg['id_col']);
            $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();
            if ($resource === 'countries') $this->hydrateCountryRelations($row);
        }

        return response()->json(['status' => true, 'message' => 'Record created', 'data' => ApiResponseFilter::filter($row, $cfg['id_col'])], 201);
    }

    public function update(Request $request, string|int $id, string $resource)
    {
        $cfg = $this->config($resource);

        $payload = [];
        foreach ($cfg['insert_fields'] as $field) {
            if ($request->has($field)) {
                $val = $request->input($field);
                if ($val === 'true') $val = true;
                elseif ($val === 'false') $val = false;
                elseif ($val === '') $val = null;
                $payload[$field] = $val;
            }
        }

        if ($resource === 'countries') {
            if ($request->input('timezone_ids') === null && $request->input('timezone_id') !== null) {
                $payload['timezone_ids'] = $request->input('timezone_id');
            }
            if ($request->input('language_ids') === null && $request->input('language_id') !== null) {
                $payload['language_ids'] = $request->input('language_id');
            }
        }

        $this->normalizeJsonFields($resource, $payload);

        // ->has() (field present, even if empty-string-turned-null by Laravel's
        // ConvertEmptyStringsToNull middleware), not ->input() !== null — mirrors
        // Node's `req.body.field !== undefined` check, so an intentionally empty
        // value still triggers a mapping resync (e.g. clearing all coupons).
        $hasServiceMappings = $resource === 'services' && collect(['booking_type_ids', 'booking_type_id', 'unit_ids', 'unit_id', 'charge_ids', 'charge_id', 'discount_ids', 'discount_id', 'coupon_ids', 'coupon_id'])
            ->contains(fn ($f) => $request->has($f));
        $hasCountryMappings = $resource === 'countries' && collect(['timezone_ids', 'language_ids', 'timezone_id', 'language_id'])
            ->contains(fn ($f) => $request->has($f));

        if (empty($payload) && ! $hasServiceMappings && ! $hasCountryMappings) {
            return response()->json(['status' => false, 'message' => 'No fields to update'], 400);
        }

        $this->applyAuditOnUpdate($cfg, $payload, $request);

        if ($resource === 'services') {
            $relations = $this->getServiceRelationIds($request);
            $ok = DB::transaction(function () use ($cfg, $id, $payload, $hasServiceMappings, $relations) {
                if (! empty($payload)) {
                    $updated = DB::table($cfg['table'])->where($cfg['id_col'], $id)->update($payload);
                    if (! $updated) return false;
                } elseif (! DB::table($cfg['table'])->where($cfg['id_col'], $id)->exists()) {
                    return false;
                }
                if ($hasServiceMappings) $this->syncServiceMappings((int) $id, $relations);

                return true;
            });
            abort_if(! $ok, 404, 'Record not found');
            $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();
            $this->hydrateServiceRelations($row);
        } else {
            $updated = DB::table($cfg['table'])->where($cfg['id_col'], $id)->update($payload);
            abort_if(! $updated, 404, 'Record not found');
            $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();
            if ($resource === 'countries') $this->hydrateCountryRelations($row);
        }

        return response()->json(['status' => true, 'message' => 'Record updated', 'data' => ApiResponseFilter::filter($row, $cfg['id_col'])]);
    }

    public function destroy(string|int $id, string $resource)
    {
        $cfg = $this->config($resource);

        $updated = DB::table($cfg['table'])
            ->where($cfg['id_col'], $id)
            ->where('is_deleted', false)
            ->update(['is_deleted' => true]);

        abort_if(! $updated, 404, 'Record not found');

        return response()->json(['status' => true, 'message' => 'Record deleted']);
    }
}
