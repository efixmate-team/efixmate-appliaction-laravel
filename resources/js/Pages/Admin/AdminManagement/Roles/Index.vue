<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const search = ref('');
const activeOnly = ref(false);
const loading = ref(true);

const view = ref('table');
const editingId = ref(null);
const form = ref({ roleName: '', isActive: true });
const formError = ref('');
const saving = ref(false);
const deactivateTarget = ref(null);

async function load() {
    loading.value = true;
    const res = await adminApi.getRoles({
        page: page.value, limit: limit.value, search: search.value || undefined,
        isActive: activeOnly.value ? true : undefined,
    });
    if (res?.status !== false) {
        rows.value = res.data || [];
        total.value = res.total ?? 0;
    }
    loading.value = false;
}

onMounted(load);

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
    form.value = { roleName: '', isActive: true };
    formError.value = '';
    editingId.value = null;
    view.value = 'create';
}

function openEdit(row) {
    form.value = { roleName: row.role_name, isActive: !!row.is_active };
    formError.value = '';
    editingId.value = row.role_id;
    view.value = 'edit';
}

function cancelForm() {
    view.value = 'table';
}

async function submitForm() {
    formError.value = '';
    saving.value = true;
    const res = editingId.value
        ? await adminApi.updateRole({ roleId: editingId.value, roleName: form.value.roleName, isActive: form.value.isActive })
        : await adminApi.createRole({ roleName: form.value.roleName, isActive: form.value.isActive });
    saving.value = false;
    if (res?.status === false) {
        formError.value = res.message || 'Something went wrong.';
        return;
    }
    view.value = 'table';
    load();
}

async function toggleActive(row) {
    const next = !row.is_active;
    row.is_active = next;
    const res = await adminApi.toggleRole({ roleId: row.role_id, isActive: next });
    if (res?.status === false) row.is_active = !next;
}

function confirmDeactivate(row) {
    deactivateTarget.value = row;
}

async function doDeactivate() {
    const row = deactivateTarget.value;
    deactivateTarget.value = null;
    if (!row) return;
    row.is_active = false;
    await adminApi.toggleRole({ roleId: row.role_id, isActive: false });
}

async function deleteRow(row) {
    if (!window.confirm(`Delete role "${row.role_name}"?`)) return;
    await adminApi.deleteRole({ roleId: row.role_id });
    load();
}
</script>

<template>
    <AdminShell title="Admin Roles" source="client/app/admin/admin-management/roles/page.tsx">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Access Control</p>
                    <h2 class="mt-1 text-xl font-semibold text-slate-950">Admin Roles</h2>
                </div>
                <div v-if="view === 'table'" class="flex flex-wrap items-center gap-3">
                    <input v-model="search" @keyup.enter="applySearch" placeholder="Search roles..." class="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" v-model="activeOnly" @change="applySearch" /> Active only
                    </label>
                    <button @click="load" class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Refresh</button>
                    <button @click="openCreate" class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add Role</button>
                </div>
                <button v-else @click="cancelForm" class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Back to list</button>
            </div>

            <div v-if="view === 'create' || view === 'edit'" class="p-6">
                <h3 class="mb-4 text-sm font-semibold text-slate-950">{{ view === 'create' ? 'Add Role' : 'Edit Role' }}</h3>
                <div v-if="formError" class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</div>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Role name *</label>
                        <input v-model="form.roleName" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" v-model="form.isActive" /> Active
                        </label>
                    </div>
                </div>
                <div class="mt-6 flex gap-3">
                    <button @click="submitForm" :disabled="saving" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {{ saving ? 'Saving...' : (view === 'create' ? 'Create Role' : 'Save changes') }}
                    </button>
                    <button @click="cancelForm" class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600">Cancel</button>
                </div>
            </div>

            <template v-else>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 text-sm">
                        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-5 py-3">Code</th>
                                <th class="px-5 py-3">Role Name</th>
                                <th class="px-5 py-3">Status</th>
                                <th class="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="row in rows" :key="row.role_id" class="hover:bg-slate-50">
                                <td class="px-5 py-3 text-slate-500">{{ row.role_code || '-' }}</td>
                                <td class="px-5 py-3 font-medium text-slate-950">{{ row.role_name }}</td>
                                <td class="px-5 py-3">
                                    <button @click="row.is_active ? confirmDeactivate(row) : toggleActive(row)"
                                        class="rounded-full px-2 py-1 text-xs font-medium"
                                        :class="row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">
                                        {{ row.is_active ? 'Active' : 'Inactive' }}
                                    </button>
                                </td>
                                <td class="px-5 py-3 text-right">
                                    <div class="flex justify-end gap-3 text-xs font-medium">
                                        <button @click="openEdit(row)" class="text-indigo-600 hover:underline">Edit</button>
                                        <button @click="deleteRow(row)" class="text-red-600 hover:underline">Delete</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!loading && rows.length === 0"><td colspan="4" class="px-5 py-10 text-center text-slate-400">No roles found.</td></tr>
                            <tr v-if="loading"><td colspan="4" class="px-5 py-10 text-center text-slate-400">Loading...</td></tr>
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
            </template>
        </section>

        <div v-if="deactivateTarget" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h3 class="text-base font-semibold text-slate-950">Deactivate Role?</h3>
                <p class="mt-2 text-sm text-slate-500">This will suspend any admins linked to this role.</p>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="deactivateTarget = null" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                    <button @click="doDeactivate" class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Deactivate</button>
                </div>
            </div>
        </div>
    </AdminShell>
</template>
