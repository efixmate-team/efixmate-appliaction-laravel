<?php

namespace App\Http\Controllers;

use App\Support\ApiResponseFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Generic config-driven CRUD engine — direct port of
 * server/src/modules/masters/controller/lookup.controller.js. One engine, 8
 * resources (v1/config/lookup_resources.php), no joins/hydration (that's what
 * distinguishes lookup from master — see MasterCrudController).
 *
 * NOTE on parameter order: Laravel binds untyped/scalar controller parameters
 * positionally against $route->parameters(), which places real URI segments
 * (e.g. {id}) before Route::defaults() values (e.g. our 'resource' key) —
 * regardless of the order defaults() was called. So methods on routes with
 * both a real {id} and a resource default must declare $id before $resource,
 * or the two get silently swapped.
 */
class LookupCrudController extends Controller
{
    private function config(string $resource): array
    {
        $cfg = config("lookup_resources.$resource");
        abort_if($cfg === null, 404, 'Lookup resource not found');

        return $cfg;
    }

    private function normalizeField(string $field, mixed $val): mixed
    {
        if ($val === 'true') return true;
        if ($val === 'false') return false;

        if (in_array($field, ['description', 'applies_to', 'booking_type', 'payment_mode', 'area_type'], true)) {
            if ($val === null || $val === '') {
                return $field === 'description' ? '' : null;
            }

            return trim((string) $val);
        }

        if ($field === 'order_seq') {
            if ($val === null || $val === '') return 0;

            return is_numeric($val) ? (int) $val : 0;
        }

        if ($val === null) {
            if ($field === 'is_active' || $field === 'is_mandatory') return true;

            return null;
        }

        return $val === '' ? null : $val;
    }

    public function index(Request $request, string $resource)
    {
        $cfg = $this->config($resource);
        $table = $cfg['table'];

        $applyFilters = function ($query) use ($request, $cfg) {
            $query->where('is_deleted', false);
            foreach ($request->query() as $key => $value) {
                if (! in_array($key, ['page', 'limit', 'search'], true)) {
                    $query->where($key, $value);
                }
            }
        };

        $searchCol = collect($cfg['insert_fields'])->first(fn ($f) => str_contains($f, 'name')) ?? $cfg['insert_fields'][0];

        $query = DB::table($table);
        $applyFilters($query);
        if ($search = $request->query('search')) {
            $query->where($searchCol, 'like', "%{$search}%");
        }

        $totalQuery = DB::table($table);
        $applyFilters($totalQuery);
        if ($search) {
            $totalQuery->where($searchCol, 'like', "%{$search}%");
        }
        $total = $totalQuery->count();

        if (in_array('order_seq', $cfg['insert_fields'], true)) {
            $query->orderBy('order_seq');
        } else {
            $query->orderBy($cfg['id_col']);
        }

        $limit = $request->query('limit');
        $page = (int) ($request->query('page') ?? 1);
        if ($limit && $limit !== 'all') {
            $query->limit((int) $limit)->offset(($page - 1) * (int) $limit);
        }

        $rows = $query->get();

        return response()->json([
            'status' => true,
            'data' => ApiResponseFilter::filter($rows->all()),
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit === 'all' ? $total : (int) ($limit ?? 10),
            ],
        ]);
    }

    public function show(string|int $id, string $resource)
    {
        $cfg = $this->config($resource);
        $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->where('is_deleted', false)->first();
        abort_if(! $row, 404, 'Record not found');

        return response()->json(['status' => true, 'data' => ApiResponseFilter::filter($row)]);
    }

    public function store(Request $request, string $resource)
    {
        $cfg = $this->config($resource);

        $payload = [];
        foreach ($cfg['insert_fields'] as $field) {
            $payload[$field] = $this->normalizeField($field, $request->input($field));
        }

        if (in_array($resource, ['booking-types', 'payment-modes'], true)) {
            $nameField = $cfg['name_field'];
            if (! $payload[$nameField]) {
                return response()->json(['status' => false, 'message' => str_replace('_', ' ', $nameField).' is required'], 400);
            }
            $payload['order_seq'] ??= 0;
        }

        if ($cfg['audit_required']) {
            $payload['created_by'] = substr((string) ($request->user()?->admin_uid ?? 'ADM001'), 0, 12);
            $payload['created_at'] = now();
        }

        $id = DB::table($cfg['table'])->insertGetId($payload, $cfg['id_col']);
        $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();

        return response()->json(['status' => true, 'message' => 'Record created', 'data' => ApiResponseFilter::filter($row)], 201);
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

        if (empty($payload)) {
            return response()->json(['status' => false, 'message' => 'No fields to update'], 400);
        }

        $updated = DB::table($cfg['table'])->where($cfg['id_col'], $id)->update($payload);
        abort_if(! $updated, 404, 'Record not found');

        $row = DB::table($cfg['table'])->where($cfg['id_col'], $id)->first();

        return response()->json(['status' => true, 'message' => 'Record updated', 'data' => ApiResponseFilter::filter($row)]);
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
