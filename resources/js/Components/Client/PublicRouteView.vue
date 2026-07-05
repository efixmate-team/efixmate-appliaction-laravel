<script setup>
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import MigrationNotice from './MigrationNotice.vue';

const props = defineProps({
    title: { type: String, required: true },
    source: { type: String, required: true },
    path: { type: String, default: '' },
    params: { type: Object, default: () => ({}) },
});

const isHome = computed(() => props.path === '/' || props.source.includes('(landing)/page.tsx'));
const isLegal = computed(() => /policy|terms|disclaimer|agreement|safety|grievance|cookie/.test(props.path));
</script>

<template>
    <section v-if="isHome" class="bg-slate-950 text-white">
        <div class="mx-auto grid min-h-[calc(100vh-56px)] w-[92%] max-w-[1440px] items-center gap-10 py-16 lg:grid-cols-[1.1fr_.9fr]">
            <div>
                <p class="text-sm font-semibold uppercase tracking-wider text-blue-300">Verified home services</p>
                <h1 class="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                    Book trusted professionals for every repair, service and setup.
                </h1>
                <p class="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                    eFixMate brings the old Next.js client into Laravel and Vue with preserved routes, assets and API
                    integration points ready for deeper page-by-page migration.
                </p>
                <div class="mt-8 flex flex-wrap gap-3">
                    <Link href="/services" class="rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">Explore Services</Link>
                    <Link href="/become-a-partner" class="rounded-md border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Become a Partner</Link>
                </div>
            </div>
            <div class="rounded-lg border border-white/10 bg-white/5 p-5">
                <img src="/client/asssets/landing/home/hero/B-Technician.webp" alt="eFixMate technician" class="max-h-[520px] w-full object-contain" />
            </div>
        </div>
    </section>

    <section v-else class="bg-slate-50 px-6 py-10">
        <div class="mx-auto max-w-5xl">
            <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">{{ isLegal ? 'Legal' : 'Public' }}</p>
                <h1 class="mt-2 text-3xl font-semibold text-slate-950">{{ title }}</h1>
                <p class="mt-3 text-sm leading-6 text-slate-600">
                    This route has been brought into the Laravel/Vue client structure with assets and URL compatibility preserved.
                </p>
                <div class="mt-6">
                    <MigrationNotice :source="source" :params="params" />
                </div>
            </div>
        </div>
    </section>
</template>
