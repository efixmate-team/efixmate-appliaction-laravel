<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\MapAdminRolePrivilege;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of server/src/modules/admin/controller/adminPrivilegeMapping.controller.js.
 * The Node app's system-privilege auto-seeding (ensureSystemPrivilegeRows) and the
 * self-grant guard on ALLOW-toggling a system permission aren't ported — see
 * AdminManagementController's docblock for the same scope note.
 */
class AdminRolePermissionController extends Controller
{
    /** POST /api/admin/role-permissions */
    public function show(Request $request)
    {
        $data = $request->validate(['roleId' => ['required', 'integer']]);

        $menus = DB::table('efm_admin_menus')->where('is_active', true)
            ->orderBy('menu_group')->orderBy('sort_order')
            ->get(['menu_id', 'menu_name', 'menu_path', 'menu_parent_id', 'menu_group']);

        $privileges = DB::table('efm_admin_privileges')->where('is_active', true)
            ->get(['privilege_id', 'menu_id', 'privilege_name']);

        $mappings = MapAdminRolePrivilege::where('role_id', $data['roleId'])->where('is_active', true)
            ->get(['privilege_id', 'permission_type']);

        $allowIds = $mappings->where('permission_type', 'ALLOW')->pluck('privilege_id')->all();
        $denyIds = $mappings->where('permission_type', 'DENY')->pluck('privilege_id')->all();

        $privilegesByMenu = $privileges->groupBy('menu_id');

        $result = $menus->map(function ($menu) use ($privilegesByMenu, $allowIds, $denyIds) {
            $menuPrivileges = ($privilegesByMenu->get($menu->menu_id) ?? collect())->map(function ($p) use ($allowIds, $denyIds) {
                $isAllowed = in_array($p->privilege_id, $allowIds, true);
                $isDenied = in_array($p->privilege_id, $denyIds, true);

                return [
                    'privilege_id' => $p->privilege_id, 'menu_id' => $p->menu_id, 'privilege_name' => $p->privilege_name,
                    'is_assigned' => $isAllowed, 'is_allowed' => $isAllowed, 'is_denied' => $isDenied,
                ];
            })->values();

            return [
                'menu_id' => $menu->menu_id, 'menu_name' => $menu->menu_name, 'menu_path' => $menu->menu_path,
                'menu_parent_id' => $menu->menu_parent_id, 'menu_group' => $menu->menu_group,
                'privileges' => $menuPrivileges,
            ];
        });

        return response()->json(['status' => true, 'data' => $result->values()]);
    }

    /** POST /api/admin/role-permissions-toggle */
    public function toggle(Request $request)
    {
        $data = $request->validate([
            'roleId' => ['required', 'integer'],
            'privilegeId' => ['required', 'integer'],
            'isAssigned' => ['required', 'boolean'],
            'permissionType' => ['nullable', 'string'],
        ]);

        $permissionType = strtoupper($data['permissionType'] ?? 'ALLOW') === 'DENY' ? 'DENY' : 'ALLOW';
        $createdBy = (string) $request->user()->admin_id;

        if ($data['isAssigned']) {
            $opposite = $permissionType === 'ALLOW' ? 'DENY' : 'ALLOW';
            MapAdminRolePrivilege::where('role_id', $data['roleId'])->where('privilege_id', $data['privilegeId'])->where('permission_type', $opposite)->delete();

            $existing = MapAdminRolePrivilege::where('role_id', $data['roleId'])->where('privilege_id', $data['privilegeId'])->where('permission_type', $permissionType)->first();
            if ($existing) {
                $existing->update(['is_active' => true, 'updated_by' => $createdBy, 'updated_at' => now()]);
            } else {
                MapAdminRolePrivilege::create([
                    'role_id' => $data['roleId'], 'privilege_id' => $data['privilegeId'], 'permission_type' => $permissionType,
                    'is_active' => true, 'created_by' => $createdBy, 'created_at' => now(),
                ]);
            }
        } else {
            MapAdminRolePrivilege::where('role_id', $data['roleId'])->where('privilege_id', $data['privilegeId'])->where('permission_type', $permissionType)->delete();
        }

        return response()->json(['status' => true, 'message' => 'Permission updated']);
    }
}
