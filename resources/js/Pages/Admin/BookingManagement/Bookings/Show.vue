<script setup>
import { useForm, Link } from '@inertiajs/vue3';
import { route } from 'ziggy-js';

const props = defineProps({
    booking: Object,
    availableTechnicians: Array,
});

const form = useForm({ technician_id: '' });

function assign() {
    form.post(route('admin.booking-management.bookings.assign-technician', props.booking.booking_id));
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <Link :href="route('admin.booking-management.bookings.index')" class="text-sm text-blue-600 hover:underline">&larr; Back to bookings</Link>

        <h1 class="mt-2 mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ booking.booking_uid }}
            <span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {{ booking.status_label }}
            </span>
        </h1>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Customer</h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{ booking.customer?.first_name }} {{ booking.customer?.last_name }} — {{ booking.customer?.mobile_number }}
                </p>

                <h2 class="mt-4 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Service</h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ booking.service?.service }} (qty {{ booking.quantity }})</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Scheduled: {{ booking.scheduled_date }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Problem: {{ booking.problem_description }}</p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Price breakdown</h2>
                <ul v-if="booking.price_breakdown" class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li v-for="line in booking.price_breakdown.lines" :key="line.line_id" class="flex justify-between">
                        <span>{{ line.label }}</span>
                        <span>{{ line.amount }}</span>
                    </li>
                    <li class="flex justify-between border-t border-gray-200 pt-1 font-medium dark:border-gray-700">
                        <span>Customer payable</span>
                        <span>{{ booking.price_breakdown.customer_payable }}</span>
                    </li>
                </ul>
                <p v-else class="text-sm text-gray-400">No price breakdown recorded.</p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-800">
                <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Technician assignment</h2>

                <ul v-if="booking.assignments?.length" class="mb-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li v-for="a in booking.assignments" :key="a.asignment_id">
                        {{ a.technician?.first_name }} {{ a.technician?.last_name }} ({{ a.technician?.mobile_number }}) — {{ a.assignment_role }}
                    </li>
                </ul>
                <p v-else class="mb-3 text-sm text-gray-400">No technician assigned yet.</p>

                <form @submit.prevent="assign" class="flex items-center gap-2">
                    <select v-model="form.technician_id" class="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">Select technician…</option>
                        <option v-for="t in availableTechnicians" :key="t.technician_id" :value="t.technician_id">
                            {{ t.first_name }} {{ t.last_name }} ({{ t.current_jobs }}/{{ t.max_jobs }} jobs)
                        </option>
                    </select>
                    <button
                        type="submit"
                        :disabled="!form.technician_id || form.processing"
                        class="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
                    >
                        Assign
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>
