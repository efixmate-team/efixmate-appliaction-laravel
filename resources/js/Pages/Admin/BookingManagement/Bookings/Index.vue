<script setup>
import { router, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import { route } from 'ziggy-js';

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
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <h1 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Bookings</h1>

        <div class="mb-4 flex flex-wrap items-center gap-3">
            <input
                v-model="search"
                @keyup.enter="applyFilters"
                placeholder="Search by booking UID"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <select @change="filterByStatus($event.target.value)" class="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="">All statuses</option>
                <option v-for="(label, id) in statuses" :key="id" :value="id">{{ label }}</option>
            </select>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Booking UID</th>
                        <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer</th>
                        <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Service</th>
                        <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th class="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Price</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="booking in bookings.data" :key="booking.booking_id">
                        <td class="px-4 py-2 text-gray-900 dark:text-white">{{ booking.booking_uid }}</td>
                        <td class="px-4 py-2 text-gray-600 dark:text-gray-300">
                            {{ booking.customer?.first_name }} {{ booking.customer?.last_name }}
                            <div class="text-xs text-gray-400">{{ booking.customer?.mobile_number }}</div>
                        </td>
                        <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ booking.service?.service }}</td>
                        <td class="px-4 py-2">
                            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                {{ booking.status_label }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ booking.base_price }}</td>
                        <td class="px-4 py-2 text-right">
                            <Link :href="route('admin.booking-management.bookings.show', booking.booking_id)" class="text-blue-600 hover:underline">
                                View
                            </Link>
                        </td>
                    </tr>
                    <tr v-if="bookings.data.length === 0">
                        <td colspan="6" class="px-4 py-6 text-center text-gray-400">No bookings found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex gap-2">
            <Link
                v-for="link in bookings.links"
                :key="link.label"
                :href="link.url ?? '#'"
                v-html="link.label"
                class="rounded-md px-3 py-1 text-sm"
                :class="link.active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
            />
        </div>
    </div>
</template>
