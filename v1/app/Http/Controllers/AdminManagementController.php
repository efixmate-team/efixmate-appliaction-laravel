<?php

namespace App\Http\Controllers;

use Efixmate\Domain\Models\Admin;
use Efixmate\Domain\Models\AdminAuditTrail;
use Efixmate\Domain\Support\AdminTypes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Direct port of server/src/modules/admin/controller/admin.controller.js's CRUD
 * surface (registerAdmin, paginatedAdmin, getAdminById, updateAdmin,
 * toggleAdminStatus, resetAdminPassword) — used by the Admin Management > Administrators
 * page. The Node app's fine-grained "system permission" grant/revoke guard
 * (rejectIfRoleGrantsUnauthorizedSystemPermissions) isn't ported — that's a much
 * deeper permission-catalog subsystem out of scope for this pass; mutating another
 * admin's role/type here is gated only by the coarser Super-Admin-only checks Node
 * itself already applies inline, matching what's practical without Stage 7's full
 * permission-catalog work.
 */
class AdminManagementController extends Controller
{
    private function auditLog(Request $request, string $action, int $entityId, ?array $before, ?array $after): void
    {
        AdminAuditTrail::create([
            'admin_id' => $request->user()->admin_id,
            'module' => 'admin_management',
            'action' => $action,
            'entity_type' => 'admin',
            'entity_id' => $entityId,
            'payload' => ['before' => $before, 'after' => $after],
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);
    }

    private function loginUrl(?string $adminUid): ?string
    {
        if (! $adminUid) {
            return null;
        }
        $base = rtrim((string) env('OUTER_APP_URL', config('app.url')), '/');

        return "{$base}/login/{$adminUid}";
    }

    private function withLoginUrl(Admin $admin): array
    {
        return array_merge($admin->toArray(), ['login_url' => $this->loginUrl($admin->admin_uid)]);
    }

    /** POST /api/admin/create */
    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => ['required', 'string', 'max:100'],
            'lastName' => ['nullable', 'string', 'max:100'],
            'mobileNumber' => ['nullable', 'string', 'max:15'],
            'email' => ['required', 'email', 'max:150'],
            'password' => ['required', 'string', 'min:6'],
            'adminType' => ['nullable', 'string'],
            'roleId' => ['nullable', 'integer'],
        ]);

        abort_if(
            ($data['adminType'] ?? AdminTypes::ADMIN) === AdminTypes::SUPER_ADMIN
                && $request->user()->admin_type !== AdminTypes::SUPER_ADMIN,
            403,
            'Forbidden: Super Admin creation is restricted'
        );

        abort_if(Admin::where('email', $data['email'])->exists(), 400, 'Admin already exists');

        $admin = Admin::create([
            'admin_uid' => (string) str()->uuid(),
            'first_name' => $data['firstName'],
            'last_name' => $data['lastName'] ?? null,
            'mobile_number' => $data['mobileNumber'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'secret_key' => (string) random_int(100000, 999999),
            'admin_type' => $data['adminType'] ?? AdminTypes::ADMIN,
            'role_id' => $data['roleId'] ?? null,
            'role_active' => isset($data['roleId']),
            'is_active' => true,
            'created_by' => (string) $request->user()->admin_id,
            'created_at' => now(),
        ]);
        $admin->update(['admin_code' => 'ADM-'.str_pad((string) $admin->admin_id, 4, '0', STR_PAD_LEFT)]);

        $this->auditLog($request, 'ADMIN_CREATE', $admin->admin_id, null, ['email' => $admin->email, 'admin_type' => $admin->admin_type, 'role_id' => $admin->role_id]);

        return response()->json(['status' => true, 'message' => 'Admin registered successfully', 'data' => $this->withLoginUrl($admin)], 201);
    }

    /** POST /api/admin/admin-paginated */
    public function paginated(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = max(1, (int) $request->input('limit', 10));
        $search = $request->input('search');
        $isActive = $request->input('isActive');
        $sortBy = $request->input('sortBy', 'admin_id');
        $sortDir = strtoupper((string) $request->input('sortDir', 'DESC')) === 'ASC' ? 'asc' : 'desc';

        $query = DB::table('efm_admins as a')
            ->leftJoin('efm_admin_roles as r', 'a.role_id', '=', 'r.role_id')
            ->select('a.*', 'r.role_name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('a.first_name', 'like', "%{$search}%")
                    ->orWhere('a.last_name', 'like', "%{$search}%")
                    ->orWhere('a.email', 'like', "%{$search}%")
                    ->orWhere('a.mobile_number', 'like', "%{$search}%");
            });
        }
        if ($isActive !== null && $isActive !== '') {
            $query->where('a.is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        $total = (clone $query)->count();
        $rows = $query->orderBy($sortBy, $sortDir)->limit($limit)->offset(($page - 1) * $limit)->get();

        $data = $rows->map(function ($row) {
            $arr = (array) $row;
            unset($arr['password'], $arr['secret_key'], $arr['totp_secret_encrypted']);
            $arr['login_url'] = $this->loginUrl($arr['admin_uid'] ?? null);

            return $arr;
        });

        return response()->json([
            'status' => true, 'data' => $data->values(), 'total' => $total, 'page' => $page,
            'limit' => $limit, 'totalPages' => (int) ceil($total / max($limit, 1)),
        ]);
    }

    /** POST /api/admin/get */
    public function show(Request $request)
    {
        $adminId = $request->input('adminId');
        abort_if(! $adminId, 400, 'adminId required');

        $row = DB::table('efm_admins as a')
            ->leftJoin('efm_admin_roles as r', 'a.role_id', '=', 'r.role_id')
            ->where('a.admin_id', $adminId)
            ->select('a.*', 'r.role_name')
            ->first();
        abort_if(! $row, 404, 'Admin not found');

        $data = (array) $row;
        unset($data['password'], $data['secret_key'], $data['totp_secret_encrypted']);
        $data['login_url'] = $this->loginUrl($data['admin_uid'] ?? null);

        return response()->json(['status' => true, 'data' => $data]);
    }

    /** POST /api/admin/update */
    public function update(Request $request)
    {
        $data = $request->validate([
            'adminId' => ['required', 'integer'],
            'firstName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['nullable', 'string', 'max:100'],
            'mobileNumber' => ['nullable', 'string', 'max:15'],
            'email' => ['nullable', 'email', 'max:150'],
            'password' => ['nullable', 'string', 'min:6'],
            'adminType' => ['nullable', 'string'],
            'isActive' => ['nullable', 'boolean'],
            'roleId' => ['nullable', 'integer'],
        ]);

        $before = Admin::find($data['adminId']);
        abort_if(! $before, 404, 'Admin not found');

        $becomingSuperAdmin = ($data['adminType'] ?? null) === AdminTypes::SUPER_ADMIN;
        $isSuperAdmin = $before->admin_type === AdminTypes::SUPER_ADMIN;
        abort_if(
            ($becomingSuperAdmin || $isSuperAdmin) && $request->user()->admin_type !== AdminTypes::SUPER_ADMIN,
            403,
            'Forbidden: Super Admin changes are restricted'
        );

        $beforeSnapshot = ['first_name' => $before->first_name, 'last_name' => $before->last_name, 'email' => $before->email, 'is_active' => $before->is_active, 'role_id' => $before->role_id, 'admin_type' => $before->admin_type];

        $updates = array_filter([
            'first_name' => $data['firstName'] ?? null,
            'last_name' => $data['lastName'] ?? null,
            'mobile_number' => $data['mobileNumber'] ?? null,
            'email' => $data['email'] ?? null,
            'admin_type' => $data['adminType'] ?? null,
            'role_id' => $data['roleId'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($data['password'])) {
            $updates['password'] = Hash::make($data['password']);
        }
        if (array_key_exists('isActive', $data) && $data['isActive'] !== null) {
            $updates['is_active'] = $data['isActive'];
        }
        $updates['updated_by'] = (string) $request->user()->admin_id;
        $updates['updated_at'] = now();

        $before->update($updates);

        $this->auditLog($request, 'ADMIN_UPDATE', $before->admin_id, $beforeSnapshot, [
            'first_name' => $before->first_name, 'last_name' => $before->last_name, 'email' => $before->email,
            'is_active' => $before->is_active, 'role_id' => $before->role_id, 'admin_type' => $before->admin_type,
            'password_changed' => ! empty($data['password']),
        ]);

        return response()->json(['status' => true, 'message' => 'Admin updated', 'data' => $this->withLoginUrl($before->fresh())]);
    }

    /** POST /api/admin/toggle-status — also used by the client as "delete" (isActive:false). */
    public function toggleStatus(Request $request)
    {
        $adminId = $request->input('adminId');
        abort_if(! $adminId, 400, 'adminId required');

        $admin = Admin::find($adminId);
        abort_if(! $admin, 404, 'Admin not found');
        abort_if(
            $admin->admin_type === AdminTypes::SUPER_ADMIN && $request->user()->admin_type !== AdminTypes::SUPER_ADMIN,
            403,
            'Forbidden: Super Admin status changes are restricted'
        );

        $nextActive = $request->has('isActive') ? (bool) $request->input('isActive') : ! $admin->is_active;
        $wasActive = $admin->is_active;
        $admin->update(['is_active' => $nextActive]);

        $this->auditLog($request, $nextActive ? 'ADMIN_UPDATE' : 'ADMIN_DELETE', $admin->admin_id, ['is_active' => $wasActive], ['is_active' => $nextActive]);

        return response()->json(['status' => true, 'message' => 'Admin '.($nextActive ? 'activated' : 'deactivated').' successfully', 'data' => $this->withLoginUrl($admin->fresh())]);
    }

    /** POST /api/admin/reset-password — Super Admin only. */
    public function resetPassword(Request $request)
    {
        abort_if($request->user()->admin_type !== AdminTypes::SUPER_ADMIN, 403, 'Forbidden: Super Admin only');

        $data = $request->validate(['adminId' => ['required', 'integer'], 'newPassword' => ['required', 'string', 'min:6']]);

        $admin = Admin::find($data['adminId']);
        abort_if(! $admin, 404, 'Admin not found');

        $admin->update(['password' => Hash::make($data['newPassword'])]);
        $this->auditLog($request, 'ADMIN_PASSWORD_RESET', $admin->admin_id, null, ['admin_id' => $admin->admin_id]);

        return response()->json(['status' => true, 'message' => 'Password updated successfully']);
    }
}
