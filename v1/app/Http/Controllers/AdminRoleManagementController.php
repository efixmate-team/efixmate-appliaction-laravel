<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminRole;
use Illuminate\Http\Request;

/** Direct port of server/src/modules/admin/controller/adminRole.controller.js. */
class AdminRoleManagementController extends Controller
{
    /** POST /api/admin/roles-create */
    public function store(Request $request)
    {
        $data = $request->validate(['roleName' => ['required', 'string', 'max:100'], 'isActive' => ['nullable', 'boolean']]);

        $role = AdminRole::create([
            'role_name' => $data['roleName'],
            'is_active' => $data['isActive'] ?? true,
            'created_by' => (string) $request->user()->admin_id,
            'created_at' => now(),
        ]);
        $role->update(['role_code' => 'ROLE-'.str_pad((string) $role->role_id, 3, '0', STR_PAD_LEFT)]);

        return response()->json(['status' => true, 'message' => 'Role created successfully', 'data' => $role], 201);
    }

    /** POST /api/admin/role-paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = max(1, (int) $request->input('limit', 10));
        $search = $request->input('search');

        $query = AdminRole::where('is_deleted', false);
        if ($search) {
            $query->where('role_name', 'like', "%{$search}%");
        }

        $total = (clone $query)->count();
        $data = $query->orderBy($request->input('sortBy', 'role_id'), strtoupper((string) $request->input('sortDir', 'DESC')) === 'ASC' ? 'asc' : 'desc')
            ->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json(['status' => true, 'data' => $data, 'total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))]);
    }

    /** POST /api/admin/roles-update */
    public function update(Request $request)
    {
        $data = $request->validate(['roleId' => ['required', 'integer'], 'roleName' => ['nullable', 'string', 'max:100'], 'isActive' => ['nullable', 'boolean']]);

        $role = AdminRole::find($data['roleId']);
        abort_if(! $role, 404, 'Role not found');

        $role->update(array_filter([
            'role_name' => $data['roleName'] ?? null,
            'is_active' => array_key_exists('isActive', $data) ? $data['isActive'] : null,
            'updated_by' => (string) $request->user()->admin_id,
            'updated_at' => now(),
        ], fn ($v) => $v !== null));

        return response()->json(['status' => true, 'message' => 'Role updated successfully', 'data' => $role->fresh()]);
    }

    /** POST /api/admin/roles-delete — soft delete. */
    public function destroy(Request $request)
    {
        $data = $request->validate(['roleId' => ['required', 'integer']]);
        AdminRole::where('role_id', $data['roleId'])->where('is_deleted', false)->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Role deleted successfully']);
    }

    /** POST /api/admin/roles-toggle */
    public function toggle(Request $request)
    {
        $data = $request->validate(['roleId' => ['required', 'integer'], 'isActive' => ['required', 'boolean']]);

        $role = AdminRole::find($data['roleId']);
        abort_if(! $role, 404, 'Role not found');

        $role->update(['is_active' => $data['isActive'], 'updated_by' => (string) $request->user()->admin_id, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Role status updated', 'data' => $role->fresh()]);
    }

    /** GET /api/admin/roles-dropdown */
    public function dropdown()
    {
        $roles = AdminRole::where('is_active', true)->where('is_deleted', false)
            ->orderBy('role_name')->get(['role_id as id', 'role_name as label']);

        return response()->json(['status' => true, 'data' => $roles]);
    }
}
