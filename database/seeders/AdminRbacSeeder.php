<?php

namespace Database\Seeders;

use App\Models\Admin;
use Efixmate\Domain\Models\AdminMenu;
use Efixmate\Domain\Models\AdminPrivilege;
use Efixmate\Domain\Models\AdminRole;
use Efixmate\Domain\Models\MapAdminRolePrivilege;
use Illuminate\Database\Seeder;

/**
 * Seeds enough RBAC data to exercise the pivot-table-driven permission check end to
 * end: a BOOKING_MANAGE privilege, a role granting it, a SUPER_ADMIN (bypasses RBAC),
 * and a scoped admin with that role (for the positive/negative RBAC verification —
 * see the migration plan's Verification section, step 4).
 */
class AdminRbacSeeder extends Seeder
{
    public function run(): void
    {
        $menu = AdminMenu::firstOrCreate(
            ['menu_path' => '/admin/booking-management/bookings'],
            [
                'menu_name' => 'Bookings',
                'menu_icon' => 'calendar',
                'menu_group_id' => 1,
                'menu_group' => 'Booking Management',
                'sort_order' => 1,
                'is_active' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        $privilege = AdminPrivilege::firstOrCreate(
            ['menu_id' => $menu->menu_id, 'privilege_name' => 'BOOKING_MANAGE'],
            ['is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );

        $role = AdminRole::firstOrCreate(
            ['role_code' => 'BOOKING_OPS'],
            ['role_name' => 'Booking Ops', 'is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );

        MapAdminRolePrivilege::firstOrCreate(
            ['role_id' => $role->role_id, 'privilege_id' => $privilege->privilege_id, 'permission_type' => 'ALLOW'],
            ['is_active' => true, 'created_by' => 'seed', 'created_at' => now()]
        );

        Admin::firstOrCreate(
            ['email' => 'super@efixmate.test'],
            [
                'admin_uid' => (string) str()->uuid(),
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'mobile_number' => '9000000001',
                'password' => bcrypt('password'),
                'secret_key' => bin2hex(random_bytes(16)),
                'admin_type' => 'S',
                'is_active' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );

        Admin::firstOrCreate(
            ['email' => 'booking-ops@efixmate.test'],
            [
                'admin_uid' => (string) str()->uuid(),
                'first_name' => 'Booking',
                'last_name' => 'Ops',
                'mobile_number' => '9000000002',
                'password' => bcrypt('password'),
                'secret_key' => bin2hex(random_bytes(16)),
                'admin_type' => 'A',
                'role_id' => $role->role_id,
                'role_active' => true,
                'is_active' => true,
                'created_by' => 'seed',
                'created_at' => now(),
            ]
        );
    }
}
