<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminMenu;
use Illuminate\Http\Request;

/** Direct port of server/src/modules/admin/controller/menu.controller.js. */
class AdminMenuManagementController extends Controller
{
    /**
     * GET /api/admin/menus — the sidebar's data source, matching Next.js's
     * adminAPI.getMenus() shape exactly: menus grouped by menu_group_id, each
     * group's menus carrying menu_type (P/C/I), menu_parent_id and menu_icon
     * for client-side tree building (see the outer app's AdminSidebar.vue).
     * Full per-role privilege filtering is not yet wired end-to-end (no seeded
     * role/privilege data to filter against) — every active admin currently
     * sees every active menu, matching a Super Admin's view.
     */
    public function myMenus()
    {
        $menus = AdminMenu::where('is_active', true)
            ->orderBy('menu_group_id')->orderBy('sort_order')->orderBy('menu_id')
            ->get(['menu_id', 'menu_name', 'menu_path', 'menu_icon', 'menu_type', 'menu_parent_id', 'menu_group_id', 'menu_group', 'sort_order']);

        $groups = $menus->groupBy('menu_group_id')->map(function ($groupMenus, $groupId) {
            return [
                'menu_group_id' => (int) $groupId,
                'menu_group' => $groupMenus->first()->menu_group,
                'menus' => $groupMenus->values(),
            ];
        })->values();

        return response()->json(['status' => true, 'groups' => $groups]);
    }

    /** POST /api/admin/create-menus */
    public function store(Request $request)
    {
        $data = $request->validate([
            'menuName' => ['required', 'string', 'max:100'],
            'menuPath' => ['nullable', 'string', 'max:255'],
            'menuIcon' => ['nullable', 'string', 'max:100'],
            'menuParentId' => ['nullable', 'integer'],
            'menuGroupId' => ['nullable', 'integer'],
            'menuGroup' => ['nullable', 'string', 'max:100'],
            'menuType' => ['nullable', 'string', 'in:I,P,C'],
        ]);

        $groupId = $data['menuGroupId'] ?? null;
        if (! $groupId && ! empty($data['menuGroup'])) {
            $groupId = AdminMenu::where('menu_group', $data['menuGroup'])->value('menu_group_id');
            $groupId ??= ((int) AdminMenu::max('menu_group_id')) + 1;
        }

        $sortOrder = ((int) AdminMenu::max('sort_order')) + 1;

        $menu = AdminMenu::create([
            'menu_name' => $data['menuName'],
            'menu_path' => $data['menuPath'] ?? ($data['menuType'] === 'P' ? '#' : null),
            'menu_icon' => $data['menuIcon'] ?? 'LayoutGrid',
            'menu_parent_id' => $data['menuParentId'] ?? null,
            'menu_group_id' => $groupId,
            'menu_group' => $data['menuGroup'] ?? null,
            'sort_order' => $sortOrder,
            'menu_type' => $data['menuType'] ?? 'I',
            'is_active' => true,
            'created_by' => (string) $request->user()->admin_id,
            'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Menu Created Successfully!!', 'data' => $menu], 201);
    }

    /** POST /api/admin/update-menus — only name/path/icon/isActive are mutable here, matching Node. */
    public function update(Request $request)
    {
        $data = $request->validate([
            'menuId' => ['required', 'integer'],
            'menuName' => ['nullable', 'string', 'max:100'],
            'menuPath' => ['nullable', 'string', 'max:255'],
            'menuIcon' => ['nullable', 'string', 'max:100'],
            'sortOrder' => ['nullable', 'integer'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $menu = AdminMenu::find($data['menuId']);
        abort_if(! $menu, 404, 'Menu not found');

        $menu->update(array_filter([
            'menu_name' => $data['menuName'] ?? null,
            'menu_path' => $data['menuPath'] ?? null,
            'menu_icon' => $data['menuIcon'] ?? null,
            'sort_order' => $data['sortOrder'] ?? null,
            'is_active' => array_key_exists('isActive', $data) ? $data['isActive'] : null,
            'updated_by' => (string) $request->user()->admin_id,
            'updated_at' => now(),
        ], fn ($v) => $v !== null));

        return response()->json(['status' => true, 'message' => 'Menu Updated Successfully!!', 'data' => $menu->fresh()]);
    }

    /** POST /api/admin/deactivate-menus */
    public function deactivate(Request $request)
    {
        $data = $request->validate(['menuId' => ['required', 'integer']]);
        $menu = AdminMenu::find($data['menuId']);
        abort_if(! $menu, 404, 'Menu not found');
        $menu->update(['is_active' => false]);

        return response()->json(['status' => true, 'message' => 'Menu deactivated Successfully!!', 'data' => $menu->fresh()]);
    }

    /** POST /api/admin/activate-menus */
    public function activate(Request $request)
    {
        $data = $request->validate(['menuId' => ['required', 'integer']]);
        $menu = AdminMenu::find($data['menuId']);
        abort_if(! $menu, 404, 'Menu not found');
        $menu->update(['is_active' => true]);

        return response()->json(['status' => true, 'message' => 'Menu activated Successfully!!', 'data' => $menu->fresh()]);
    }

    /** POST /api/admin/bulk-deactivate-menus */
    public function bulkDeactivate(Request $request)
    {
        $data = $request->validate(['menuIds' => ['required', 'array', 'min:1'], 'menuIds.*' => ['integer']]);
        AdminMenu::whereIn('menu_id', $data['menuIds'])->update(['is_active' => false]);

        return response()->json(['status' => true, 'message' => 'Menus deactivated Successfully!!']);
    }

    /** POST /api/admin/bulk-activate-menus */
    public function bulkActivate(Request $request)
    {
        $data = $request->validate(['menuIds' => ['required', 'array', 'min:1'], 'menuIds.*' => ['integer']]);
        AdminMenu::whereIn('menu_id', $data['menuIds'])->update(['is_active' => true]);

        return response()->json(['status' => true, 'message' => 'Menus activated Successfully!!']);
    }

    /** POST /api/admin/menu-paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = max(1, (int) $request->input('limit', 10));
        $search = $request->input('search');
        $isActive = $request->input('isActive');

        $query = AdminMenu::where('is_deleted', false);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('menu_name', 'like', "%{$search}%")
                    ->orWhere('menu_path', 'like', "%{$search}%")
                    ->orWhere('menu_group', 'like', "%{$search}%");
            });
        }
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        $total = (clone $query)->count();
        $data = $query->orderBy($request->input('sortBy', 'menu_id'), strtoupper((string) $request->input('sortDir', 'DESC')) === 'ASC' ? 'asc' : 'desc')
            ->limit($limit)->offset(($page - 1) * $limit)->get();

        return response()->json(['status' => true, 'data' => $data, 'total' => $total, 'page' => $page, 'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1))]);
    }

    /** GET /api/admin/get-parents */
    public function parents()
    {
        $parents = AdminMenu::where('menu_type', 'P')->orderBy('menu_name')->get(['menu_id as id', 'menu_name as label']);

        return response()->json(['status' => true, 'parents' => $parents]);
    }

    /** GET /api/admin/get-groups */
    public function groups()
    {
        $groups = AdminMenu::whereNotNull('menu_group')->distinct()
            ->orderBy('menu_group')->get(['menu_group_id as id', 'menu_group as label']);

        return response()->json(['status' => true, 'groups' => $groups]);
    }

    /** POST /api/admin/delete-menus — soft delete. */
    public function destroy(Request $request)
    {
        $data = $request->validate(['menuId' => ['required', 'integer']]);
        AdminMenu::where('menu_id', $data['menuId'])->where('is_deleted', false)->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Menu Deleted Successfully!!']);
    }
}
