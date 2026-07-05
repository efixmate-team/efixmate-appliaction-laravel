<script setup>
import { ref, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';

const props = defineProps({ adminId: [String, Number] });

const loading = ref(true);
const error = ref('');
const data = ref(null);

async function load() {
    loading.value = true;
    error.value = '';
    const res = await adminApi.getAdminById({ adminId: Number(props.adminId) || props.adminId });
    if (res?.status === false) {
        error.value = res.message || 'Admin not found.';
        data.value = null;
    } else {
        data.value = Array.isArray(res?.data) ? res.data[0] : res?.data;
    }
    loading.value = false;
}

onMounted(load);
</script>

<template>
    <AdminShell title="Admin Detail" source="client/app/admin/admin-management/admins/[adminId]/page.tsx">
        <div class="mb-4">
            <Link href="/admin/admin-management/admins" class="text-sm font-medium text-indigo-600 hover:underline">&larr; Back to Administrators</Link>
        </div>

        <div v-if="loading" class="space-y-3">
            <div class="h-24 animate-pulse rounded-lg bg-slate-100"></div>
            <div class="h-48 animate-pulse rounded-lg bg-slate-100"></div>
        </div>

        <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p class="text-sm text-red-700">{{ error }}</p>
            <div class="mt-4 flex justify-center gap-3">
                <Link href="/admin/admin-management/admins" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Go Back</Link>
                <button @click="load" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Retry</button>
            </div>
        </div>

        <section v-else-if="data" class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center gap-4 border-b border-slate-200 p-6">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white">
                    {{ (data.first_name || '?').charAt(0) }}{{ (data.last_name || '').charAt(0) }}
                </div>
                <div>
                    <h2 class="text-xl font-semibold text-slate-950">{{ data.first_name }} {{ data.last_name }}</h2>
                    <p class="text-sm text-slate-500">{{ data.email }}</p>
                </div>
            </div>

            <div class="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin ID</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.admin_id }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.mobile_number || '-' }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.role_name || data.roleName || data.role?.role_name || '-' }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Type</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.admin_type === 'S' ? 'Super Admin' : data.admin_type === 'A' ? 'Admin' : data.admin_type }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                    <p class="mt-1 text-sm font-medium" :class="data.is_active ? 'text-emerald-600' : 'text-slate-500'">{{ data.is_active ? 'Active' : 'Inactive' }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Email Verified</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.email_verified ? 'Verified' : 'Not Verified' }}</p>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile Verified</p>
                    <p class="mt-1 text-sm text-slate-900">{{ data.mobile_verified ? 'Verified' : 'Not Verified' }}</p>
                </div>
                <div v-if="data.created_at">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Created At</p>
                    <p class="mt-1 text-sm text-slate-900">{{ new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                </div>
                <div class="sm:col-span-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Login URL</p>
                    <p class="mt-1 break-all font-mono text-xs text-slate-600">{{ data.login_url || '-' }}</p>
                </div>
            </div>
        </section>
    </AdminShell>
</template>
