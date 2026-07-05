<script setup>
import { useForm, Link } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import AdminShell from '@/Layouts/AdminShell.vue';

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
    <AdminShell :title="booking.booking_uid" source="client/app/admin/booking-management/bookings/[id]/page.tsx">
        <div class="space-y-5">
            <Link :href="route('admin.booking-management.bookings.index')" class="text-sm font-medium text-indigo-600 hover:underline">Back to bookings</Link>

            <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-2xl font-semibold text-slate-950">{{ booking.booking_uid }}</h2>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{{ booking.status_label }}</span>
            </div>

            <div class="grid gap-5 lg:grid-cols-2">
                <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-slate-950">Customer</h3>
                    <p class="mt-2 text-sm text-slate-600">{{ booking.customer?.first_name }} {{ booking.customer?.last_name }} - {{ booking.customer?.mobile_number }}</p>
                    <h3 class="mt-5 text-sm font-semibold text-slate-950">Service</h3>
                    <p class="mt-2 text-sm text-slate-600">{{ booking.service?.service }} (qty {{ booking.quantity }})</p>
                    <p class="mt-1 text-sm text-slate-500">Scheduled: {{ booking.scheduled_date }}</p>
                    <p class="mt-1 text-sm text-slate-500">Problem: {{ booking.problem_description }}</p>
                </section>

                <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-slate-950">Price breakdown</h3>
                    <ul v-if="booking.price_breakdown" class="mt-3 space-y-2 text-sm text-slate-600">
                        <li v-for="line in booking.price_breakdown.lines" :key="line.line_id" class="flex justify-between"><span>{{ line.label }}</span><span>{{ line.amount }}</span></li>
                        <li class="flex justify-between border-t border-slate-200 pt-2 font-medium text-slate-950"><span>Customer payable</span><span>{{ booking.price_breakdown.customer_payable }}</span></li>
                    </ul>
                    <p v-else class="mt-3 text-sm text-slate-400">No price breakdown recorded.</p>
                </section>

                <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <h3 class="text-sm font-semibold text-slate-950">Technician assignment</h3>
                    <ul v-if="booking.assignments?.length" class="mt-3 space-y-2 text-sm text-slate-600">
                        <li v-for="a in booking.assignments" :key="a.asignment_id">{{ a.technician?.first_name }} {{ a.technician?.last_name }} ({{ a.technician?.mobile_number }}) - {{ a.assignment_role }}</li>
                    </ul>
                    <p v-else class="mt-3 text-sm text-slate-400">No technician assigned yet.</p>

                    <form @submit.prevent="assign" class="mt-4 flex flex-wrap items-center gap-2">
                        <select v-model="form.technician_id" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
                            <option value="">Select technician</option>
                            <option v-for="t in availableTechnicians" :key="t.technician_id" :value="t.technician_id">{{ t.first_name }} {{ t.last_name }} ({{ t.current_jobs }}/{{ t.max_jobs }} jobs)</option>
                        </select>
                        <button type="submit" :disabled="!form.technician_id || form.processing" class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Assign</button>
                    </form>
                </section>
            </div>
        </div>
    </AdminShell>
</template>