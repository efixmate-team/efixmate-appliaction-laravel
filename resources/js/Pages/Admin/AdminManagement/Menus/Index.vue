<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';
import MenuFormDrawer from './MenuFormDrawer.vue';

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const search = ref('');
const activeOnly = ref(false);
const loading = ref(true);
const parents = ref([]);
const groups = ref([]);

const drawerOpen = ref(false);
const drawerMode = ref('create');
const drawerMenu = ref(null);
const saving = ref(false);
const deactivateTarget = ref(null);

const typeBadge = { P: { label: 'Section', class: 'bg-blue-100 text-blue-700' }, C: { label: 'Sub-menu', class: 'bg-purple-100 text-purple-700' }, I: { label: 'Link', class: 'bg-pink-100 text-pink-700' } };

async function load() {
    loading.value = true;
    const res = await adminApi.paginatedMenu({
        page: page.value, limit: limit.value, search: search.value || undefined,
        isActive: activeOnly.value ? true : undefined,
    });
    if (res?.status !== false) {
        rows.value = res.data || [];
        total.value = res.total ?? 0;
    }
    loading.value = false;
}

async function loadLookups() {
    const [parentsRes, groupsRes] = await Promise.all([adminApi.getMenuParent(), adminApi.getMenuGroup()]);
    if (parentsRes?.status !== false) parents.value = parentsRes.parents || [];
    if (groupsRes?.status !== false) groups.value = groupsRes.groups || [];
}

onMounted(() => {
    load();
    loadLookups();
});

function applySearch() {
    page.value = 1;
    load();
}

function goToPage(p) {
    page.value = p;
    load();
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

function openCreate() {
    drawerMode.value = 'create';
    drawerMenu.value = null;
    drawerOpen.value = true;
}

function openEdit(row) {
    drawerMode.value = 'edit';
    drawerMenu.value = row;
    drawerOpen.value = true;
}

async function handleSubmit(payload) {
    saving.value = true;
    let res;
    if (drawerMode.value === 'edit') {
        res = await adminApi.updateMenu({
            menuId: drawerMenu.value.menu_id, menuName: payload.menu_name, menuPath: payload.menu_path,
            menuIcon: payload.menu_icon, isActive: payload.is_active,
        });
    } else {
        res = await adminApi.createMenu({
            menuName: payload.menu_name, menuPath: payload.menu_path, menuIcon: payload.menu_icon,
            menuParentId: payload.menu_type === 'C' ? payload.menu_parent_id : null,
            menuGroupId: payload.menu_group_id, menuGroup: payload.menu_group, menuType: payload.menu_type,
        });
        await loadLookups();
    }
    saving.value = false;
    if (res?.status === false) {
        window.alert(res.message || 'Something went wrong.');
        return;
    }
    drawerOpen.value = false;
    load();
}

async function toggleActive(row) {
    const next = !row.is_active;
    row.is_active = next;
    const res = next ? await adminApi.activateMenu({ menuId: row.menu_id }) : null;
    if (!next) {
        deactivateTarget.value = row;
        row.is_active = true; // revert until confirmed
        return;
    }
    if (res?.status === false) row.is_active = !next;
}

async function doDeactivate() {
    const row = deactivateTarget.value;
    deactivateTarget.value = null;
    if (!row) return;
    row.is_active = false;
    const res = await adminApi.deactivateMenu({ menuId: row.menu_id });
    if (res?.status === false) row.is_active = true;
}

async function deleteRow(row, index) {
    if (!window.confirm(`Delete menu "${row.menu_name}"?`)) return;
    rows.value.splice(index, 1);
    const res = await adminApi.deleteMenu({ menuId: row.menu_id });
    if (res?.status === false) {
        load();
        return;
    }
    if (rows.value.length === 0 && page.value > 1) {
        page.value -= 1;
    }
    load();
}
</script>

<template>
    <AdminShell title="Admin's Menus" source="client/app/admin/admin-management/menus/page.tsx">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Admin</p>
                    <h2 class="mt-1 text-xl font-semibold text-slate-950">Admin's Menus</h2>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <input v-model="search" @keyup.enter="applySearch" placeholder="Search menus..." class="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" v-model="activeOnly" @change="applySearch" /> Active only
                    </label>
                    <button @click="load" class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Refresh</button>
                    <button @click="openCreate" class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add Menu</button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-5 py-3">Menu Name</th>
                            <th class="px-5 py-3">Path</th>
                            <th class="px-5 py-3">Group</th>
                            <th class="px-5 py-3">Type</th>
                            <th class="px-5 py-3">Status</th>
                            <th class="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="(row, idx) in rows" :key="row.menu_id" class="hover:bg-slate-50">
                            <td class="px-5 py-3 font-medium text-slate-950">{{ row.menu_name }}</td>
                            <td class="px-5 py-3 font-mono text-xs text-slate-500">{{ row.menu_path }}</td>
                            <td class="px-5 py-3 text-slate-600">{{ row.menu_group }}</td>
                            <td class="px-5 py-3">
                                <span class="rounded-full px-2 py-1 text-xs font-medium" :class="typeBadge[row.menu_type]?.class || 'bg-slate-100 text-slate-600'">
                                    {{ typeBadge[row.menu_type]?.label || row.menu_type }}
                                </span>
                            </td>
                            <td class="px-5 py-3">
                                <button @click="toggleActive(row)" class="rounded-full px-2 py-1 text-xs font-medium" :class="row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">
                                    {{ row.is_active ? 'Active' : 'Inactive' }}
                                </button>
                            </td>
                            <td class="px-5 py-3 text-right">
                                <div class="flex justify-end gap-3 text-xs font-medium">
                                    <button @click="openEdit(row)" class="text-indigo-600 hover:underline">Edit</button>
                                    <button @click="deleteRow(row, idx)" class="text-red-600 hover:underline">Delete</button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!loading && rows.length === 0"><td colspan="6" class="px-5 py-10 text-center text-slate-400">No menus found. Click "Add Menu" to get started.</td></tr>
                        <tr v-if="loading"><td colspan="6" class="px-5 py-10 text-center text-slate-400">Loading...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-500">
                <span>{{ total }} total</span>
                <div class="flex gap-2">
                    <button :disabled="page <= 1" @click="goToPage(page - 1)" class="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">Prev</button>
                    <span>Page {{ page }} / {{ totalPages }}</span>
                    <button :disabled="page >= totalPages" @click="goToPage(page + 1)" class="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">Next</button>
                </div>
            </div>
        </section>

        <MenuFormDrawer
            :open="drawerOpen"
            :mode="drawerMode"
            :menu="drawerMenu"
            :parents="parents"
            :groups="groups"
            :saving="saving"
            @close="drawerOpen = false"
            @submit="handleSubmit"
        />

        <div v-if="deactivateTarget" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h3 class="text-base font-semibold text-slate-950">Are you sure?</h3>
                <p class="mt-2 text-sm text-slate-500">It will disappear from the sidebar once deactivated.</p>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="deactivateTarget = null" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                    <button @click="doDeactivate" class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Deactivate</button>
                </div>
            </div>
        </div>
    </AdminShell>
</template>
