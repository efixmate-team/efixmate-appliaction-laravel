<?php

namespace App\Services;

use App\Constants\AdminTypes;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

/**
 * Mirrors server/src/services/permission.service.js's core resolution path:
 * Admin.role_id (single active role) -> efm_map_admin_role_privilege -> efm_admin_privileges
 * -> efm_admin_menus, with ALLOW/DENY permission_type and a SUPER_ADMIN bypass.
 *
 * The source service also translates legacy menu-path privilege names into newer
 * "business permission" constants and builds grouped sidebar menus — that translation
 * layer exists to bridge an old naming scheme and isn't reproduced here; privileges are
 * seeded directly under the permission names routes check against (see Stage 8 seeder).
 */
class AdminPermissionService
{
    /** @var array<int, array{permissions: string[], deniedPermissions: string[]}> */
    private static array $requestCache = [];

    public function getRoleId(Admin $admin): ?int
    {
        if (! $admin->is_active || ! $admin->role_active || ! $admin->role_id) {
            return null;
        }

        return $admin->role_id;
    }

    /**
     * @return array{permissions: string[], deniedPermissions: string[]}
     */
    public function getPermissionSummary(Admin $admin): array
    {
        if ($admin->admin_type === AdminTypes::SUPER_ADMIN) {
            return ['permissions' => ['*'], 'deniedPermissions' => []];
        }

        if (isset(self::$requestCache[$admin->admin_id])) {
            return self::$requestCache[$admin->admin_id];
        }

        $roleId = $this->getRoleId($admin);
        if (! $roleId) {
            return self::$requestCache[$admin->admin_id] = ['permissions' => [], 'deniedPermissions' => []];
        }

        $rows = DB::table('efm_admin_roles as r')
            ->join('efm_map_admin_role_privilege as mrp', function ($join) {
                $join->on('mrp.role_id', '=', 'r.role_id')->where('mrp.is_active', true);
            })
            ->join('efm_admin_privileges as p', function ($join) {
                $join->on('p.privilege_id', '=', 'mrp.privilege_id')->where('p.is_active', true);
            })
            ->join('efm_admin_menus as m', function ($join) {
                $join->on('m.menu_id', '=', 'p.menu_id')->where('m.is_active', true);
            })
            ->where('r.role_id', $roleId)
            ->where('r.is_active', true)
            ->where(DB::raw("TRIM(COALESCE(m.menu_path, ''))"), '<>', '')
            ->select('p.privilege_name', 'mrp.permission_type')
            ->distinct()
            ->get();

        $allow = [];
        $deny = [];
        foreach ($rows as $row) {
            $name = strtoupper(trim($row->privilege_name ?? ''));
            if ($name === '') {
                continue;
            }
            $isDeny = strtoupper(trim($row->permission_type ?: 'ALLOW')) === 'DENY';
            if ($isDeny) {
                $deny[$name] = true;
            } else {
                $allow[$name] = true;
            }
        }

        return self::$requestCache[$admin->admin_id] = [
            'permissions' => array_keys($allow),
            'deniedPermissions' => array_keys($deny),
        ];
    }

    public function hasPermission(Admin $admin, string $permission): bool
    {
        if ($admin->admin_type === AdminTypes::SUPER_ADMIN) {
            return true;
        }

        $summary = $this->getPermissionSummary($admin);
        $permission = strtoupper($permission);

        if (in_array($permission, $summary['deniedPermissions'], true)) {
            return false;
        }

        return in_array($permission, $summary['permissions'], true);
    }
}
