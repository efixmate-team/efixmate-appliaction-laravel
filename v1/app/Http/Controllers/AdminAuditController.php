<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminAuditTrail;
use Illuminate\Http\Request;

/** Direct port of server/.../admin/audit.routes.js. */
class AdminAuditController extends Controller
{
    /** GET /api/admin/audit */
    public function index(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, (int) $request->query('limit', 25));

        $query = AdminAuditTrail::query();
        if ($request->filled('admin_id')) {
            $query->where('admin_id', $request->query('admin_id'));
        }
        if ($request->filled('module')) {
            $query->where('module', $request->query('module'));
        }

        $total = (clone $query)->count();
        $data = $query->orderByDesc('audit_id')->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json([
            'status' => true, 'data' => $data,
            'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))],
        ]);
    }

    /** GET /api/admin/audit/{id} */
    public function show(int $id)
    {
        return response()->json(['status' => true, 'data' => AdminAuditTrail::findOrFail($id)]);
    }

    /** GET /api/admin/audit/entity/{entityType}/{entityId} */
    public function forEntity(string $entityType, int $entityId)
    {
        $rows = AdminAuditTrail::where('entity_type', $entityType)->where('entity_id', $entityId)
            ->orderByDesc('created_at')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }
}
