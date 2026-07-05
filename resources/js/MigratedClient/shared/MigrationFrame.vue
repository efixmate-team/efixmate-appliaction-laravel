<script setup>
defineProps({
    title: { type: String, required: true },
    source: { type: String, required: true },
    routePath: { type: String, default: '' },
    area: { type: String, default: 'client' },
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <section class="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
        <div class="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">{{ area }} vue migration</p>
                    <h1 class="mt-2 text-2xl font-semibold">{{ title }}</h1>
                    <p v-if="routePath" class="mt-1 text-sm text-slate-500">{{ routePath }}</p>
                </div>
                <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Converted shell</span>
            </div>

            <dl class="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <dt class="font-medium text-slate-500">Original Next source</dt>
                    <dd class="mt-2 break-all font-mono text-xs text-slate-700">{{ source }}</dd>
                </div>
                <div class="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <dt class="font-medium text-slate-500">Route params</dt>
                    <dd class="mt-2 break-all font-mono text-xs text-slate-700">{{ JSON.stringify(params) }}</dd>
                </div>
            </dl>

            <p class="mt-6 text-sm leading-6 text-slate-600">
                This Vue file mirrors the old client structure so the Laravel app is self-contained.
                Replace this shell with a native Vue implementation as each React component is ported.
            </p>
        </div>
    </section>
</template>