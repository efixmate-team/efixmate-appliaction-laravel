<script setup>
import { onMounted, ref } from 'vue';
import AdminShell from '@/Layouts/AdminShell.vue';
import { apiRequest } from '@/lib/apiClient';

const props = defineProps({
    title: { type: String, required: true },
    section: { type: String, required: true },
    source: { type: String, required: true },
    apiPath: { type: String, required: true },
    params: { type: Object, default: () => ({}) },
});

const loading = ref(true);
const result = ref(null);

onMounted(async () => {
    result.value = await apiRequest(props.apiPath, { params: props.params });
    loading.value = false;
});
</script>

<template>
    <AdminShell :title="title" :source="source">
        <section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">{{ section }}</p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">{{ title }}</h2>
                    <p class="mt-2 text-sm text-slate-500">Route kept from the old Next.js admin panel and connected to Laravel v1.</p>
                </div>
                <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Port pending</span>
            </div>

            <div class="mt-6 grid gap-4 lg:grid-cols-2">
                <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Old source</p>
                    <p class="mt-2 break-all font-mono text-xs text-slate-700">{{ source }}</p>
                </div>
                <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">v1 endpoint</p>
                    <p class="mt-2 break-all font-mono text-xs text-slate-700">{{ apiPath }}</p>
                </div>
            </div>

            <div class="mt-6 rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">API response</p>
                <pre class="mt-3 max-h-80 overflow-auto text-xs leading-5">{{ loading ? 'Loading...' : JSON.stringify(result, null, 2) }}</pre>
            </div>
        </section>
    </AdminShell>
</template>