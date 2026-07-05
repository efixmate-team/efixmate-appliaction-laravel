<script setup>
import { ref, computed, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';

const props = defineProps({ admin: Object });
const isSuperAdmin = computed(() => props.admin?.admin_type === 'S');

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(10);
const search = ref('');
const activeOnly = ref(false);
const loading = ref(true);
const roles = ref([]);

const view = ref('table'); // 'table' | 'create' | 'edit'
const editingId = ref(null);
const form = ref({ firstName: '', lastName: '', email: '', mobileNumber: '', password: '', adminType: 'A', roleId: '', isActive: true });
const formError = ref('');
const saving = ref(false);

const deactivateTarget = ref(null);
const passwordTarget = ref(null);
const passwordForm = ref({ new: '', confirm: '' });
const passwordError = ref('');
const copiedId = ref(null);

async function load() {
    loading.value = true;
    const res = await adminApi.getAdmins({
        page: page.value, limit: limit.value, search: search.value || undefined,
        isActive: activeOnly.value ? true : undefined,
    });
    if (res?.status !== false) {
        rows.value = res.data || [];
        total.value = res.total ?? 0;
    }
    loading.value = false;
}

async function loadRoles() {
    const res = await adminApi.getRoleDropdown();
    if (res?.status !== false) roles.value = res.data || [];
}

onMounted(() => {
    load();
    loadRoles();
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
    form.value = { firstName: '', lastName: '', email: '', mobileNumber: '', password: '', adminType: 'A', roleId: '', isActive: true };
    formError.value = '';
    editingId.value = null;
    view.value = 'create';
}

function openEdit(row) {
    form.value = {
        firstName: row.first_name || '', lastName: row.last_name || '', email: row.email || '',
        mobileNumber: row.mobile_number || '', password: '', adminType: row.admin_type || 'A',
        roleId: row.role_id || '', isActive: !!row.is_active,
    };
    formError.value = '';
    editingId.value = row.admin_id;
    view.value = 'edit';
}

function cancelForm() {
    view.value = 'table';
    formError.value = '';
}

async function submitForm() {
    formError.value = '';
    saving.value = true;
    let res;
    if (editingId.value) {
        res = await adminApi.updateAdmin({
            adminId: editingId.value, firstName: form.value.firstName, lastName: form.value.lastName,
            email: form.value.email, mobileNumber: form.value.mobileNumber, adminType: form.value.adminType,
            roleId: form.value.roleId || null, isActive: form.value.isActive,
        });
    } else {
        res = await adminApi.register({
            firstName: form.value.firstName, lastName: form.value.lastName, email: form.value.email,
            mobileNumber: form.value.mobileNumber, password: form.value.password, adminType: form.value.adminType,
            roleId: form.value.roleId || null,
        });
    }
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
    row.is_active = next; // optimistic
    const res = await adminApi.deleteAdmin({ adminId: row.admin_id, isActive: next });
    if (res?.status === false) {
        row.is_active = !next;
    }
}

function confirmDeactivate(row) {
    deactivateTarget.value = row;
}

async function doDeactivate() {
    const row = deactivateTarget.value;
    deactivateTarget.value = null;
    if (!row) return;
    row.is_active = false;
    await adminApi.deleteAdmin({ adminId: row.admin_id, isActive: false });
}

async function deleteRow(row) {
    if (!window.confirm(`Delete admin "${row.first_name} ${row.last_name}"?`)) return;
    await adminApi.deleteAdmin({ adminId: row.admin_id, isActive: false });
    load();
}

function openPasswordModal(row) {
    passwordTarget.value = row;
    passwordForm.value = { new: '', confirm: '' };
    passwordError.value = '';
}

async function submitPasswordReset() {
    if (passwordForm.value.new.length < 6) {
        passwordError.value = 'Password must be at least 6 characters.';
        return;
    }
    if (passwordForm.value.new !== passwordForm.value.confirm) {
        passwordError.value = 'Passwords do not match.';
        return;
    }
    const res = await adminApi.resetPassword({ adminId: passwordTarget.value.admin_id, newPassword: passwordForm.value.new });
    if (res?.status === false) {
        passwordError.value = res.message || 'Failed to reset password.';
        return;
    }
    passwordTarget.value = null;
}

function copyLoginUrl(row) {
    if (!row.login_url) return;
    navigator.clipboard?.writeText(row.login_url);
    copiedId.value = row.admin_id;
    setTimeout(() => { if (copiedId.value === row.admin_id) copiedId.value = null; }, 2000);
}
</script>

<template>
    <AdminShell title="Administrators" source="client/app/admin/admin-management/admins/page.tsx">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Management</p>
                    <h2 class="mt-1 text-xl font-semibold text-slate-950">Administrators</h2>
                </div>
                <div v-if="view === 'table'" class="flex flex-wrap items-center gap-3">
                    <input v-model="search" @keyup.enter="applySearch" placeholder="Search admins..." class="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" v-model="activeOnly" @change="applySearch" /> Active only
                    </label>
                    <button @click="load" class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Refresh</button>
                    <button @click="openCreate" class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add Admin</button>
                </div>
                <button v-else @click="cancelForm" class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Back to list</button>
            </div>

            <!-- Create / Edit inline form -->
            <div v-if="view === 'create' || view === 'edit'" class="p-6">
                <h3 class="mb-4 text-sm font-semibold text-slate-950">{{ view === 'create' ? 'Add Admin' : 'Edit Admin' }}</h3>
                <div v-if="formError" class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ formError }}</div>
                <div class="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600">First name *</label>
                        <input v-model="form.firstName" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Last name</label>
                        <input v-model="form.lastName" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Email *</label>
                        <input v-model="form.email" type="email" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Mobile number *</label>
                        <input v-model="form.mobileNumber" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div v-if="view === 'create'">
                        <label class="block text-xs font-medium text-slate-600">Temporary password *</label>
                        <input v-model="form.password" type="password" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Type *</label>
                        <select v-model="form.adminType" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                            <option value="A">Admin</option>
                            <option v-if="isSuperAdmin" value="S">Super Admin</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Role</label>
                        <select v-model="form.roleId" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                            <option value="">No role</option>
                            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.label }}</option>
                        </select>
                    </div>
                    <div v-if="view === 'edit'" class="flex items-end">
                        <label class="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" v-model="form.isActive" /> Active
                        </label>
                    </div>
                </div>
                <div class="mt-6 flex gap-3">
                    <button @click="submitForm" :disabled="saving" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {{ saving ? 'Saving...' : (view === 'create' ? 'Create Admin' : 'Save changes') }}
                    </button>
                    <button @click="cancelForm" class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600">Cancel</button>
                </div>
            </div>

            <!-- Table -->
            <template v-else>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 text-sm">
                        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-5 py-3">Code</th>
                                <th class="px-5 py-3">Administrator</th>
                                <th class="px-5 py-3">Email</th>
                                <th class="px-5 py-3">Mobile</th>
                                <th class="px-5 py-3">Type</th>
                                <th class="px-5 py-3">Role</th>
                                <th class="px-5 py-3">Login URL</th>
                                <th class="px-5 py-3">Status</th>
                                <th class="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="row in rows" :key="row.admin_id" class="hover:bg-slate-50">
                                <td class="px-5 py-3 text-slate-500">{{ row.admin_code || '-' }}</td>
                                <td class="px-5 py-3 font-medium text-slate-950">
                                    <Link :href="`/admin/admin-management/admins/${row.admin_id}`" class="hover:underline">{{ row.first_name }} {{ row.last_name }}</Link>
                                </td>
                                <td class="px-5 py-3 text-slate-600">{{ row.email }}</td>
                                <td class="px-5 py-3 text-slate-600">{{ row.mobile_number }}</td>
                                <td class="px-5 py-3 text-slate-600">{{ row.admin_type === 'S' ? 'Super Admin' : 'Admin' }}</td>
                                <td class="px-5 py-3 text-slate-600">{{ row.role_name || '-' }}</td>
                                <td class="px-5 py-3">
                                    <div class="flex items-center gap-2">
                                        <span class="max-w-[160px] truncate font-mono text-xs text-slate-500">{{ row.login_url }}</span>
                                        <button @click="copyLoginUrl(row)" class="text-xs text-indigo-600 hover:underline">{{ copiedId === row.admin_id ? 'Copied!' : 'Copy' }}</button>
                                    </div>
                                </td>
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
                                        <button v-if="isSuperAdmin" @click="openPasswordModal(row)" class="text-slate-600 hover:underline">Password</button>
                                        <button @click="deleteRow(row)" class="text-red-600 hover:underline">Delete</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!loading && rows.length === 0"><td colspan="9" class="px-5 py-10 text-center text-slate-400">No administrators found.</td></tr>
                            <tr v-if="loading"><td colspan="9" class="px-5 py-10 text-center text-slate-400">Loading...</td></tr>
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

        <!-- Deactivate confirmation modal -->
        <div v-if="deactivateTarget" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h3 class="text-base font-semibold text-slate-950">Deactivate Admin?</h3>
                <p class="mt-2 text-sm text-slate-500">This administration account will lose system access.</p>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="deactivateTarget = null" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                    <button @click="doDeactivate" class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white">Deactivate</button>
                </div>
            </div>
        </div>

        <!-- Password reset modal -->
        <div v-if="passwordTarget" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h3 class="text-base font-semibold text-slate-950">Reset Password</h3>
                <p class="mt-1 text-sm text-slate-500">{{ passwordTarget.first_name }} {{ passwordTarget.last_name }}</p>
                <div v-if="passwordError" class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ passwordError }}</div>
                <div class="mt-4 space-y-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600">New Password</label>
                        <input v-model="passwordForm.new" type="password" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600">Confirm New Password</label>
                        <input v-model="passwordForm.confirm" type="password" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="passwordTarget = null" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                    <button @click="submitPasswordReset" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Reset Password</button>
                </div>
            </div>
        </div>
    </AdminShell>
</template>
