<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\AdminPrivilege;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Direct port of server/src/modules/admin/controller/privileges.controller.js. The
 * Node app's "system permission" self-grant guard (missingSystemPermissionsForActor)
 * isn't ported — see AdminManagementController's docblock for the same scope note.
 */
class AdminPrivilegeManagementController extends Controller
{
    /** POST /api/admin/privileges-create */
    public function store(Request $request)
    {
        $data = $request->validate(['menuId' => ['required', 'integer'], 'privilegeName' => ['required', 'string', 'max:100']]);

        $exists = AdminPrivilege::where('menu_id', $data['menuId'])
            ->whereRaw('LOWER(privilege_name) = ?', [strtolower($data['privilegeName'])])
            ->where('is_deleted', false)->exists();
        abort_if($exists, 400, 'Privilege already exists for this menu');

        $privilege = AdminPrivilege::create([
            'menu_id' => $data['menuId'],
            'privilege_name' => strtoupper(trim($data['privilegeName'])),
            'is_active' => true,
            'created_by' => (string) $request->user()->admin_id,
            'created_at' => now(),
        ]);

        return response()->json(['status' => true, 'message' => 'Privilege created successfully', 'data' => $privilege], 201);
    }

    /** POST /api/admin/privileges-list */
    public function index()
    {
        return response()->json(['status' => true, 'data' => AdminPrivilege::where('is_deleted', false)->orderBy('privilege_id')->get()]);
    }

    /** POST /api/admin/privileges-list-with-menu */
    public function listWithMenu()
    {
        $rows = DB::table('efm_admin_privileges as p')
            ->join('efm_admin_menus as m', 'p.menu_id', '=', 'm.menu_id')
            ->where('p.is_deleted', false)->where('m.is_deleted', false)
            ->select('p.*', 'm.menu_name')
            ->orderBy('p.privilege_id')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** POST /api/admin/privileges-by-menu */
    public function byMenu(Request $request)
    {
        $data = $request->validate(['menuId' => ['required', 'integer']]);
        $rows = AdminPrivilege::where('menu_id', $data['menuId'])->where('is_deleted', false)->orderBy('privilege_id')->get();

        return response()->json(['status' => true, 'data' => $rows]);
    }

    /** POST /api/admin/privileges-update */
    public function update(Request $request)
    {
        $data = $request->validate(['privilegeId' => ['required', 'integer'], 'privilegeName' => ['nullable', 'string', 'max:100'], 'isActive' => ['nullable', 'boolean']]);

        $privilege = AdminPrivilege::find($data['privilegeId']);
        abort_if(! $privilege, 404, 'Privilege not found');

        $privilege->update(array_filter([
            'privilege_name' => isset($data['privilegeName']) ? strtoupper(trim($data['privilegeName'])) : null,
            'is_active' => array_key_exists('isActive', $data) ? $data['isActive'] : null,
            'updated_by' => (string) $request->user()->admin_id,
            'updated_at' => now(),
        ], fn ($v) => $v !== null));

        return response()->json(['status' => true, 'message' => 'Privilege updated successfully', 'data' => $privilege->fresh()]);
    }

    /** POST /api/admin/privileges-delete — soft delete. */
    public function destroy(Request $request)
    {
        $data = $request->validate(['privilegeId' => ['required', 'integer']]);
        AdminPrivilege::where('privilege_id', $data['privilegeId'])->update(['is_deleted' => true]);

        return response()->json(['status' => true, 'message' => 'Privilege deleted successfully']);
    }

    /** POST /api/admin/privileges-toggle */
    public function toggle(Request $request)
    {
        $data = $request->validate(['privilegeId' => ['required', 'integer'], 'isActive' => ['required', 'boolean']]);

        $privilege = AdminPrivilege::find($data['privilegeId']);
        abort_if(! $privilege, 404, 'Privilege not found');

        $privilege->update(['is_active' => $data['isActive'], 'updated_by' => (string) $request->user()->admin_id, 'updated_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Privilege status updated', 'data' => $privilege->fresh()]);
    }
}
