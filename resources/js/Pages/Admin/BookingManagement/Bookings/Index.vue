<script setup>
import { router, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import { route } from 'ziggy-js';
import AdminShell from '@/Layouts/AdminShell.vue';

const props = defineProps({
    bookings: Object,
    filters: Object,
    statuses: Object,
});

const search = ref(props.filters.search ?? '');

function applyFilters() {
    router.get(route('admin.booking-management.bookings.index'), { search: search.value }, { preserveState: true });
}

function filterByStatus(statusId) {
    router.get(route('admin.booking-management.bookings.index'), { status: statusId }, { preserveState: true });
}
</script>

<template>
    <AdminShell title="Bookings" source="client/app/admin/booking-management/bookings/page.tsx">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Booking Management</p>
                    <h2 class="mt-1 text-xl font-semibold text-slate-950">Bookings</h2>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <input v-model="search" @keyup.enter="applyFilters" placeholder="Search booking UID" class="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <select @change="filterByStatus($event.target.value)" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="">All statuses</option>
                        <option v-for="(label, id) in statuses" :key="id" :value="id">{{ label }}</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-5 py-3">Booking UID</th>
                            <th class="px-5 py-3">Customer</th>
                            <th class="px-5 py-3">Service</th>
                            <th class="px-5 py-3">Status</th>
                            <th class="px-5 py-3">Price</th>
                            <th class="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="booking in bookings.data" :key="booking.booking_id" class="hover:bg-slate-50">
                            <td class="px-5 py-3 font-medium text-slate-950">{{ booking.booking_uid }}</td>
                            <td class="px-5 py-3 text-slate-600">
                                {{ booking.customer?.first_name }} {{ booking.customer?.last_name }}
                                <div class="text-xs text-slate-400">{{ booking.customer?.mobile_number }}</div>
                            </td>
                            <td class="px-5 py-3 text-slate-600">{{ booking.service?.service }}</td>
                            <td class="px-5 py-3"><span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{{ booking.status_label }}</span></td>
                            <td class="px-5 py-3 text-slate-600">{{ booking.base_price }}</td>
                            <td class="px-5 py-3 text-right"><Link :href="route('admin.booking-management.bookings.show', booking.booking_id)" class="font-medium text-indigo-600 hover:underline">View</Link></td>
                        </tr>
                        <tr v-if="bookings.data.length === 0"><td colspan="6" class="px-5 py-10 text-center text-slate-400">No bookings found.</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="flex flex-wrap gap-2 border-t border-slate-200 p-4">
                <Link v-for="link in bookings.links" :key="link.label" :href="link.url ?? '#'" v-html="link.label" class="rounded-md px-3 py-1 text-sm" :class="link.active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'" />
            </div>
        </section>
    </AdminShell>
</template>