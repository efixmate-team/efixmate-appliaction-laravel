<script setup>
import MigrationNotice from './MigrationNotice.vue';

defineProps({
    title: { type: String, required: true },
    source: { type: String, required: true },
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <section class="bg-slate-50 px-4 py-6">
        <div class="mx-auto max-w-6xl">
            <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Technician app</p>
                <h1 class="mt-2 text-2xl font-semibold text-slate-950">{{ title }}</h1>
                <p class="mt-2 text-sm text-slate-600">Technician route is now mounted in Vue/Inertia with the old URL structure preserved.</p>
                <div class="mt-6 grid gap-4 md:grid-cols-3">
                    <a href="/technician/login" class="rounded-md border border-slate-200 p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</a>
                    <a href="/technician/register" class="rounded-md border border-slate-200 p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Register</a>
                    <a href="/contact-us" class="rounded-md border border-slate-200 p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Support</a>
                </div>
                <div class="mt-6">
                    <MigrationNotice :source="source" :params="params" />
                </div>
            </div>
        </div>
    </section>
</template>
