<?php

namespace Database\Seeders;

use Efixmate\Domain\Models\AdminMenu;
use Illuminate\Database\Seeder;

/**
 * Direct port of server/scripts/seed-menus.mjs's $adminMenuRows — the real
 * Next.js production admin sidebar structure (names, paths, icons, groups,
 * parent/child hierarchy, sort order). Idempotent: matches existing rows by
 * menu_path (or menu_name for parent-only "" path rows) and updates them.
 *
 * Group IDs: 1 Main | 2 Operations | 3 Booking Management | 4 User Management
 * | 5 Technician Management | 6 Finance | 7 Masters | 8 Lookups | 9 Admin Management
 */
class AdminMenuSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // ── 1. Main (gid 1) ─────────────────────────────────────────────
            ['Dashboard', '/admin/dashboard', 'LayoutDashboard', null, 1, 'Main', 1, 'I'],
            ['Reports', '/admin/reports', 'BarChart2', null, 1, 'Main', 2, 'I'],
            ['Tracker', '/admin/tracker', 'Activity', null, 1, 'Main', 3, 'I'],

            // ── 2. Operations (gid 2) ─────────────────────────────────────
            ['Live Dashboard', '/admin/operations/live-dashboard', 'Activity', null, 2, 'Operations', 1, 'I'],
            ['Booking Operations', '/admin/operations/bookings', 'CalendarClock', null, 2, 'Operations', 2, 'I'],
            ['Audit Logs', '/admin/operations/audit', 'Shield', null, 2, 'Operations', 3, 'I'],
            ['Contact Inquiries', '/admin/contact-inquiries', 'Mail', null, 2, 'Operations', 4, 'I'],
            ['Support Center', '', 'Headphones', null, 2, 'Operations', 5, 'P'],
            ['Overview', '/admin/support', 'LayoutDashboard', 8, 2, 'Operations', 1, 'C'],
            ['Tickets', '/admin/support/tickets', 'Ticket', 8, 2, 'Operations', 2, 'C'],
            ['Categories', '/admin/support/categories', 'Tags', 8, 2, 'Operations', 3, 'C'],
            ['SLA', '/admin/support/sla', 'Clock', 8, 2, 'Operations', 4, 'C'],
            ['CRM', '', 'ContactRound', null, 2, 'Operations', 6, 'P'],
            ['Overview', '/admin/crm', 'LayoutDashboard', 13, 2, 'Operations', 1, 'C'],
            ['Customers', '/admin/crm/customers', 'Users', 13, 2, 'Operations', 2, 'C'],
            ['Complaints', '/admin/crm/complaints', 'AlertCircle', 13, 2, 'Operations', 3, 'C'],
            ['Spam Review', '/admin/crm/spam', 'ShieldAlert', 13, 2, 'Operations', 4, 'C'],
            ['Analytics', '/admin/crm/analytics', 'BarChart2', 13, 2, 'Operations', 5, 'C'],
            ['Notification Center', '', 'Bell', null, 2, 'Operations', 7, 'P'],
            ['Overview', '/admin/notifications', 'LayoutDashboard', 19, 2, 'Operations', 1, 'C'],
            ['Templates', '/admin/notifications/templates', 'FileText', 19, 2, 'Operations', 2, 'C'],
            ['Broadcast', '/admin/notifications/broadcast', 'Radio', 19, 2, 'Operations', 3, 'C'],
            ['Scheduled', '/admin/notifications/scheduled', 'CalendarClock', 19, 2, 'Operations', 4, 'C'],
            ['History', '/admin/notifications/history', 'History', 19, 2, 'Operations', 5, 'C'],
            ['Logs', '/admin/notifications/logs', 'ClipboardList', 19, 2, 'Operations', 6, 'C'],
            ['Security Center', '', 'ShieldCheck', null, 2, 'Operations', 9, 'P'],
            ['Overview', '/admin/security', 'LayoutDashboard', 26, 2, 'Operations', 1, 'C'],
            ['Sessions', '/admin/security/sessions', 'Monitor', 26, 2, 'Operations', 2, 'C'],
            ['2FA', '/admin/security/2fa', 'KeyRound', 26, 2, 'Operations', 3, 'C'],
            ['IP Rules', '/admin/security/ip-rules', 'Globe', 26, 2, 'Operations', 4, 'C'],
            ['Alerts', '/admin/security/alerts', 'AlertTriangle', 26, 2, 'Operations', 5, 'C'],

            // ── 3. Booking Management (gid 3) ───────────────────────────────
            ['Bookings', '/admin/booking-management/bookings', 'CalendarDays', null, 3, 'Booking Management', 1, 'I'],
            ['Booking Workflow', '/admin/booking-management/workflow', 'GitBranch', null, 3, 'Booking Management', 2, 'I'],

            // ── 4. User Management (gid 4) ────────────────────────────────
            ['Users', '/admin/user-management/users', 'Users', null, 4, 'User Management', 1, 'I'],
            ['Feedbacks', '/admin/user-management/feedbacks', 'MessageCircle', null, 4, 'User Management', 2, 'I'],

            // ── 5. Technician Management (gid 5) ──────────────────────────
            ['Technicians', '/admin/technician-management/technicians', 'Wrench', null, 5, 'Technician Management', 1, 'I'],
            ['Applications', '/admin/technician-management/applications', 'ClipboardList', null, 5, 'Technician Management', 2, 'I'],
            ['Referrals', '/admin/technician-management/referrals', 'Share2', null, 5, 'Technician Management', 3, 'I'],

            // ── 6. Finance (gid 6) ────────────────────────────────────────
            ['Payments', '/admin/transactions/payments', 'CreditCard', null, 6, 'Finance', 1, 'I'],
            ['Invoices', '/admin/transactions/invoices', 'FileText', null, 6, 'Finance', 2, 'I'],
            ['Refunds', '/admin/transactions/refunds', 'RefreshCw', null, 6, 'Finance', 3, 'I'],
            ['Payouts', '/admin/transactions/payouts', 'ExternalLink', null, 6, 'Finance', 4, 'I'],
            ['Taxes', '/admin/transactions/taxes', 'Receipt', null, 6, 'Finance', 5, 'I'],
            ['Finance Center', '', 'Landmark', null, 6, 'Finance', 6, 'P'],
            ['Overview', '/admin/finance', 'LayoutDashboard', 44, 6, 'Finance', 1, 'C'],
            ['Invoices', '/admin/finance/invoices', 'Receipt', 44, 6, 'Finance', 2, 'C'],
            ['Payouts', '/admin/finance/payouts', 'ArrowUpRight', 44, 6, 'Finance', 3, 'C'],
            ['Refunds', '/admin/finance/refunds', 'RefreshCw', 44, 6, 'Finance', 4, 'C'],
            ['Failed', '/admin/finance/failed', 'XCircle', 44, 6, 'Finance', 5, 'C'],
            ['Reports', '/admin/finance/reports', 'BarChart2', 44, 6, 'Finance', 6, 'C'],
            ['Wallet', '/admin/finance/wallet', 'Wallet', 44, 6, 'Finance', 7, 'C'],

            // ── 7. Masters (gid 7) ─────────────────────────────────────────
            ['Geography', '', 'Globe', null, 7, 'Masters', 1, 'P'],
            ['Countries', '/admin/masters/geography/countries', 'Globe', 52, 7, 'Masters', 1, 'C'],
            ['States', '/admin/masters/geography/states', 'Map', 52, 7, 'Masters', 2, 'C'],
            ['Cities', '/admin/masters/geography/cities', 'Building', 52, 7, 'Masters', 3, 'C'],
            ['Areas', '/admin/masters/geography/areas', 'MapPin', 52, 7, 'Masters', 4, 'C'],
            ['Services Management', '', 'Wrench', null, 7, 'Masters', 2, 'P'],
            ['Service Categories', '/admin/masters/services-management/service-categories', 'Tags', 57, 7, 'Masters', 1, 'C'],
            ['Services', '/admin/masters/services-management/services', 'Wrench', 57, 7, 'Masters', 2, 'C'],
            ['Time Slot Management', '', 'Clock', null, 7, 'Masters', 3, 'P'],
            ['Time Slots', '/admin/masters/time-slot-management/time-slots', 'Clock', 60, 7, 'Masters', 1, 'C'],
            ['Finance Management', '', 'DollarSign', null, 7, 'Masters', 4, 'P'],
            ['Charges', '/admin/masters/finance-management/charges', 'Zap', 62, 7, 'Masters', 1, 'C'],
            ['Taxes', '/admin/masters/finance-management/taxes', 'Receipt', 62, 7, 'Masters', 2, 'C'],
            ['Pricing Rules', '/admin/masters/pricing-rules', 'Tags', 62, 7, 'Masters', 3, 'C'],
            ['Discounts', '/admin/masters/finance-management/discounts', 'Percent', 62, 7, 'Masters', 4, 'C'],
            ['Commissions', '/admin/masters/finance-management/commissions', 'TrendingUp', 62, 7, 'Masters', 5, 'C'],
            ['Coupon Management', '', 'Ticket', null, 7, 'Masters', 5, 'P'],
            ['Coupons', '/admin/masters/coupon-management/coupons', 'Ticket', 68, 7, 'Masters', 1, 'C'],
            ['Announcement Management', '', 'Megaphone', null, 7, 'Masters', 6, 'P'],
            ['Overview', '/admin/masters/announcement-management', 'LayoutDashboard', 70, 7, 'Masters', 1, 'C'],
            ['Promotions', '/admin/masters/announcement-management/promotions', 'Megaphone', 70, 7, 'Masters', 2, 'C'],
            ['Announcements', '/admin/masters/announcement-management/announcements', 'Bell', 70, 7, 'Masters', 3, 'C'],
            ['Area Map', '/admin/masters/geography/areas/map', 'MapPinned', 52, 7, 'Masters', 5, 'C'],
            ['Copy Area Setup', '/admin/masters/geography/areas', 'Copy', 52, 7, 'Masters', 6, 'C'],

            // ── 8. Lookups (gid 8) ───────────────────────────────
            ['Currencies', '/admin/lookups/currencies', 'DollarSign', null, 8, 'Lookups', 1, 'I'],
            ['Timezones', '/admin/lookups/timezones', 'Clock', null, 8, 'Lookups', 2, 'I'],
            ['Languages', '/admin/lookups/languages', 'Languages', null, 8, 'Lookups', 3, 'I'],
            ['Booking Types', '/admin/lookups/booking-types', 'Calendar', null, 8, 'Lookups', 4, 'I'],
            ['Units', '/admin/lookups/units', 'Scale', null, 8, 'Lookups', 5, 'I'],
            ['Area Types', '/admin/lookups/area-types', 'MapPinned', null, 8, 'Lookups', 6, 'I'],
            ['Document Types', '/admin/lookups/document-types', 'FileText', null, 8, 'Lookups', 7, 'I'],
            ['Payment Modes', '/admin/lookups/payment-modes', 'CreditCard', null, 8, 'Lookups', 8, 'I'],

            // ── 9. Admin Management (gid 9) ────────────────
            ['Admins', '/admin/admin-management/admins', 'Users', null, 9, 'Admin Management', 1, 'I'],
            ['Roles', '/admin/admin-management/roles', 'ShieldCheck', null, 9, 'Admin Management', 2, 'I'],
            ['Permissions', '/admin/admin-management/permissions', 'Key', null, 9, 'Admin Management', 3, 'I'],
            ['Menus', '/admin/admin-management/menus', 'Menu', null, 9, 'Admin Management', 4, 'I'],

            // ── 7. Masters — Content Management / CMS (gid 7) ─────────────
            ['Content Management', '', 'LayoutGrid', null, 7, 'Masters', 7, 'P'],
            ['CMS Pages', '/admin/cms', 'FileText', 88, 7, 'Masters', 1, 'C'],
            ['Global Sections', '/admin/cms/globals', 'Globe', 88, 7, 'Masters', 2, 'C'],

            // ── 9. Admin Management — System Settings (gid 9) ─────────────
            ['System Settings', '', 'Settings2', null, 9, 'Admin Management', 5, 'P'],
            ['Media & Uploads', '/admin/settings', 'Upload', 91, 9, 'Admin Management', 1, 'C'],
            ['Notifications', '/admin/settings/notifications', 'Bell', 91, 9, 'Admin Management', 2, 'C'],
            ['Payments', '/admin/settings/payments', 'CreditCard', 91, 9, 'Admin Management', 3, 'C'],

            // ── 7. Masters — Skills under Services Management (gid 7) ─────
            ['Skills', '/admin/masters/services-management/skills', 'Sparkles', 57, 7, 'Masters', 3, 'C'],
        ];

        $idBySeq = [];
        foreach ($rows as $i => [$name, $path, $icon, $parentSeq, $gid, $gname, $sort, $type]) {
            $realParentId = $parentSeq !== null ? ($idBySeq[$parentSeq] ?? null) : null;

            $existing = $path
                ? AdminMenu::where('menu_path', $path)->orderBy('menu_id')->first()
                : AdminMenu::where('menu_name', $name)->where(function ($q) {
                    $q->whereNull('menu_path')->orWhere('menu_path', '');
                })->orderBy('menu_id')->first();

            if ($existing) {
                $existing->update([
                    'menu_name' => $name, 'menu_icon' => $icon, 'menu_parent_id' => $realParentId,
                    'sort_order' => $sort, 'menu_group' => $gname, 'menu_group_id' => $gid, 'menu_type' => $type,
                    'is_active' => true,
                ]);
                $menuId = $existing->menu_id;
            } else {
                $menu = AdminMenu::create([
                    'menu_name' => $name, 'menu_path' => $path, 'menu_icon' => $icon,
                    'menu_parent_id' => $realParentId, 'menu_group_id' => $gid, 'menu_group' => $gname,
                    'sort_order' => $sort, 'menu_type' => $type, 'is_active' => true,
                    'created_by' => 'SYSTEM', 'created_at' => now(),
                ]);
                $menuId = $menu->menu_id;
            }
            $idBySeq[$i + 1] = $menuId;
        }

        $this->command?->info('Seeded '.count($rows).' admin menu rows.');
    }
}
