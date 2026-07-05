<script setup>
import { computed, onMounted, ref } from 'vue';
import AdminShell from '@/Layouts/AdminShell.vue';
import { adminApi } from '@/lib/apiClient';

const props = defineProps({ admin: Object });
const range = ref('7d');
const loading = ref(true);
const refreshing = ref(false);
const error = ref('');
const stats = ref(null);
const recentBookings = ref([]);
const topServices = ref([]);
const activity = ref([]);

const cards = computed(() => [
    { label: 'Revenue', value: stats.value?.kpis?.revenue?.value ?? '0', hint: 'selected period' },
    { label: 'Bookings', value: stats.value?.kpis?.bookings?.value ?? 0, hint: 'selected period' },
    { label: 'Technicians', value: stats.value?.kpis?.technicians?.value ?? 0, hint: 'active platform total' },
    { label: 'Customers', value: stats.value?.kpis?.customers?.value ?? 0, hint: 'active platform total' },
]);

async function load(isRefresh = false) {
    if (isRefresh) refreshing.value = true;
    else loading.value = true;
    error.value = '';

    const [statsRes, bookingsRes, servicesRes, activityRes] = await Promise.all([
        adminApi.getDashboardStats({ range: range.value }),
        adminApi.getRecentBookings({ limit: 8 }),
        adminApi.getTopServices({ range: range.value, limit: 5 }),
        adminApi.getDashboardActivity({ limit: 8 }),
    ]);

    const failures = [statsRes, bookingsRes, servicesRes, activityRes].filter((item) => item && item.status === false);
    if (failures.length) {
        error.value = failures[0]?.message || 'Some v1 dashboard APIs are not migrated yet.';
    }

    stats.value = statsRes?.data || null;
    recentBookings.value = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
    topServices.value = Array.isArray(servicesRes?.data) ? servicesRes.data : [];
    activity.value = Array.isArray(activityRes?.data) ? activityRes.data : [];
    loading.value = false;
    refreshing.value = false;
}

onMounted(() => load());
</script>

<template>
    <AdminShell title="Dashboard" source="client/app/admin/dashboard/page.tsx">
        <div class="space-y-6">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Operations overview</p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">Welcome, {{ props.admin?.first_name || 'Admin' }}</h2>
                    <p class="mt-1 text-sm text-slate-500">Dashboard data is loaded from the Laravel v1 API.</p>
                </div>
                <div class="flex items-center gap-2">
                    <select v-model="range" @change="load(true)" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="90d">90 days</option>
                        <option value="year">Year</option>
                    </select>
                    <button @click="load(true)" class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" :disabled="refreshing">
                        {{ refreshing ? 'Refreshing...' : 'Refresh' }}
                    </button>
                </div>
            </div>

            <div v-if="error" class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{{ error }}</div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article v-for="card in cards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ card.label }}</p>
                    <p class="mt-3 text-3xl font-semibold text-slate-950">{{ loading ? '-' : card.value }}</p>
                    <p class="mt-2 text-sm text-slate-500">{{ card.hint }}</p>
                </article>
            </div>

            <div class="grid gap-4 xl:grid-cols-3">
                <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <h3 class="text-sm font-semibold text-slate-950">Recent bookings</h3>
                    <div class="mt-4 overflow-x-auto">
                        <table class="min-w-full text-sm">
                            <thead class="text-left text-xs uppercase tracking-wide text-slate-400">
                                <tr><th class="py-2">Booking</th><th>Customer</th><th>Service</th><th>Status</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="item in recentBookings" :key="item.id" class="text-slate-700">
                                    <td class="py-3 font-medium text-indigo-600">{{ item.id }}</td>
                                    <td>{{ item.customer }}</td>
                                    <td>{{ item.service }}</td>
                                    <td>{{ item.status }}</td>
                                </tr>
                                <tr v-if="!recentBookings.length"><td colspan="4" class="py-8 text-center text-slate-400">No migrated booking data yet.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-slate-950">Top services</h3>
                    <div class="mt-4 space-y-3">
                        <div v-for="service in topServices" :key="service.name" class="flex items-center justify-between text-sm">
                            <span class="text-slate-600">{{ service.name }}</span>
                            <span class="font-semibold text-slate-950">{{ service.revenue }}</span>
                        </div>
                        <p v-if="!topServices.length" class="py-8 text-center text-sm text-slate-400">No migrated service data yet.</p>
                    </div>
                </section>
            </div>
        </div>
    </AdminShell>
</template>