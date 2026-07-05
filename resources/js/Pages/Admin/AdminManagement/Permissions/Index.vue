<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';

const tab = ref('assign'); // 'assign' | 'create'
const roles = ref([]);
const selectedRoleId = ref('');
const menus = ref([]); // full menu list (for Manage Privileges tab grouping)
const rolePermissions = ref([]); // menu rows w/ privileges, for Assign tab
const privilegesByMenu = ref({}); // menu_id -> [{privilege_id, privilege_name, ...}]
const loadingPanel = ref(false);
const loadingMenus = ref(false);
const togglingId = ref(null);

const newPrivilegeMenuId = ref(null);
const newPrivilegeName = ref('');
const editingPrivilegeId = ref(null);
const editingPrivilegeName = ref('');

const grantedCount = computed(() => rolePermissions.value.reduce((sum, m) => sum + m.privileges.filter((p) => p.is_allowed).length, 0));

function groupByMenuGroup(list) {
    const groups = {};
    for (const menu of list) {
        const key = menu.menu_group || 'Other';
        groups[key] ??= [];
        groups[key].push(menu);
    }
    return groups;
}
const groupedRolePermissions = computed(() => groupByMenuGroup(rolePermissions.value));
const groupedMenus = computed(() => groupByMenuGroup(menus.value));

async function loadRoles() {
    const res = await adminApi.getRoleDropdown();
    if (res?.status !== false) {
        roles.value = res.data || [];
        if (!selectedRoleId.value && roles.value.length) selectedRoleId.value = roles.value[0].id;
    }
}

async function loadAllMenus() {
    loadingMenus.value = true;
    const res = await adminApi.paginatedMenu({ limit: 1000, isActive: true });
    if (res?.status !== false) menus.value = res.data || [];
    loadingMenus.value = false;
}

async function loadPrivilegesByMenu() {
    const res = await adminApi.privilegesListWithMenu();
    if (res?.status === false) return;
    const map = {};
    for (const p of res.data || []) {
        map[p.menu_id] ??= [];
        map[p.menu_id].push(p);
    }
    privilegesByMenu.value = map;
}

async function loadRolePermissions() {
    if (!selectedRoleId.value) return;
    loadingPanel.value = true;
    const res = await adminApi.getRolePermissions({ roleId: selectedRoleId.value });
    if (res?.status !== false) rolePermissions.value = res.data || [];
    loadingPanel.value = false;
}

onMounted(async () => {
    await Promise.all([loadRoles(), loadAllMenus(), loadPrivilegesByMenu()]);
    await loadRolePermissions();
});

async function togglePermission(privilege, permissionType) {
    togglingId.value = privilege.privilege_id;
    const isCurrentlyThis = permissionType === 'ALLOW' ? privilege.is_allowed : privilege.is_denied;
    await adminApi.toggleRolePermission({
        roleId: selectedRoleId.value, privilegeId: privilege.privilege_id,
        permissionType, isAssigned: !isCurrentlyThis,
    });
    await loadRolePermissions();
    togglingId.value = null;
}

function startAddPrivilege(menuId) {
    newPrivilegeMenuId.value = menuId;
    newPrivilegeName.value = '';
}

async function submitAddPrivilege() {
    if (!newPrivilegeName.value.trim()) return;
    await adminApi.createPrivilege({ menuId: newPrivilegeMenuId.value, privilegeName: newPrivilegeName.value.trim() });
    newPrivilegeMenuId.value = null;
    newPrivilegeName.value = '';
    await loadPrivilegesByMenu();
    if (selectedRoleId.value) await loadRolePermissions();
}

function startEditPrivilege(priv) {
    editingPrivilegeId.value = priv.privilege_id;
    editingPrivilegeName.value = priv.privilege_name;
}

async function submitEditPrivilege() {
    if (!editingPrivilegeName.value.trim()) return;
    await adminApi.updatePrivilege({ privilegeId: editingPrivilegeId.value, privilegeName: editingPrivilegeName.value.trim(), isActive: true });
    editingPrivilegeId.value = null;
    await loadPrivilegesByMenu();
}

async function deletePrivilege(priv) {
    if (!window.confirm(`Delete privilege "${priv.privilege_name}"? This removes it from all roles.`)) return;
    await adminApi.deletePrivilege({ privilegeId: priv.privilege_id });
    await loadPrivilegesByMenu();
    if (selectedRoleId.value) await loadRolePermissions();
}
</script>

<template>
    <AdminShell title="Permission Settings" source="client/app/admin/admin-management/permissions/page.tsx">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold text-slate-950">Permission Settings</h2>
                <p class="text-sm text-slate-500">Control which sidebar sections and actions each role can access.</p>
            </div>
            <span v-if="tab === 'assign'" class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{{ grantedCount }} permission(s) granted</span>
        </div>

        <div class="mb-4 flex gap-2 border-b border-slate-200">
            <button @click="tab = 'assign'" class="border-b-2 px-4 py-2 text-sm font-medium" :class="tab === 'assign' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500'">Assign Permissions</button>
            <button @click="tab = 'create'" class="border-b-2 px-4 py-2 text-sm font-medium" :class="tab === 'create' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500'">Manage Privileges</button>
        </div>

        <div v-if="togglingId || loadingPanel || loadingMenus" class="mb-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-500">
            {{ togglingId ? 'Updating permission…' : 'Loading…' }}
        </div>

        <!-- Assign Permissions tab -->
        <section v-if="tab === 'assign'" class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 p-4">
                <label class="text-xs font-medium text-slate-600">Role</label>
                <select v-model="selectedRoleId" @change="loadRolePermissions" class="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm">
                    <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.label }}</option>
                </select>
            </div>

            <div class="divide-y divide-slate-100">
                <div v-for="(list, group) in groupedRolePermissions" :key="group">
                    <div class="sticky top-0 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {{ group }} <span class="ml-1 font-normal normal-case text-slate-400">({{ list.length }} menus)</span>
                    </div>
                    <div v-for="menu in list" :key="menu.menu_id" class="flex flex-wrap items-center gap-3 border-t border-slate-50 px-5 py-3" :class="{ 'pl-10': menu.menu_parent_id }">
                        <div class="min-w-[160px] flex-1">
                            <p class="text-sm font-medium text-slate-900">{{ menu.menu_name }}</p>
                            <p class="text-xs text-slate-400">
                                <span class="text-emerald-600">{{ menu.privileges.filter(p => p.is_allowed).length }} granted</span>
                                &middot;
                                <span class="text-red-500">{{ menu.privileges.filter(p => p.is_denied).length }} denied</span>
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="priv in menu.privileges" :key="priv.privilege_id" class="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs">
                                <span class="font-medium text-slate-700">{{ priv.privilege_name }}</span>
                                <button @click="togglePermission(priv, 'ALLOW')" class="rounded-full px-2 py-0.5" :class="priv.is_allowed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'">Allow</button>
                                <button @click="togglePermission(priv, 'DENY')" class="rounded-full px-2 py-0.5" :class="priv.is_denied ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-red-50'">Deny</button>
                            </div>
                            <p v-if="!menu.privileges.length" class="text-xs text-slate-400">No privileges defined for this menu.</p>
                        </div>
                    </div>
                </div>
                <p v-if="!Object.keys(groupedRolePermissions).length && !loadingPanel" class="px-5 py-10 text-center text-sm text-slate-400">No menus found.</p>
            </div>
        </section>

        <!-- Manage Privileges tab -->
        <section v-else class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="divide-y divide-slate-100">
                <div v-for="(list, group) in groupedMenus" :key="group">
                    <div class="sticky top-0 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ group }}</div>
                    <div v-for="menu in list" :key="menu.menu_id" class="border-t border-slate-50 px-5 py-3">
                        <p class="mb-2 text-sm font-medium text-slate-900">{{ menu.menu_name }}</p>
                        <div class="flex flex-wrap items-center gap-2">
                            <div v-for="priv in (privilegesByMenu[menu.menu_id] || [])" :key="priv.privilege_id" class="group flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs">
                                <template v-if="editingPrivilegeId === priv.privilege_id">
                                    <input v-model="editingPrivilegeName" @keyup.enter="submitEditPrivilege" @keyup.escape="editingPrivilegeId = null" class="w-32 rounded border border-slate-300 px-1 py-0.5 text-xs" autofocus />
                                    <button @click="submitEditPrivilege" class="text-emerald-600">Save</button>
                                    <button @click="editingPrivilegeId = null" class="text-slate-400">Cancel</button>
                                </template>
                                <template v-else>
                                    <span class="text-slate-700">{{ priv.privilege_name }}</span>
                                    <button @click="startEditPrivilege(priv)" class="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600">&#9998;</button>
                                    <button @click="deletePrivilege(priv)" class="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600">&times;</button>
                                </template>
                            </div>

                            <div v-if="newPrivilegeMenuId === menu.menu_id" class="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-1 text-xs">
                                <input v-model="newPrivilegeName" @keyup.enter="submitAddPrivilege" @keyup.escape="newPrivilegeMenuId = null" placeholder="PRIVILEGE_NAME" class="w-32 rounded border border-slate-300 px-1 py-0.5 text-xs" autofocus />
                                <button @click="submitAddPrivilege" class="text-emerald-600">Add</button>
                                <button @click="newPrivilegeMenuId = null" class="text-slate-400">Cancel</button>
                            </div>
                            <button v-else @click="startAddPrivilege(menu.menu_id)" class="rounded-full border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-slate-400">+ Add privilege</button>
                        </div>
                    </div>
                </div>
                <p v-if="!Object.keys(groupedMenus).length && !loadingMenus" class="px-5 py-10 text-center text-sm text-slate-400">No menus found.</p>
            </div>
        </section>
    </AdminShell>
</template>
