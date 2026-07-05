<script setup>
defineProps({
    source: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },
    params: {
        type: Object,
        default: () => ({}),
    },
});
</script>

<template>
    <main class="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <section class="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Legacy route migrated</p>
            <h1 class="mt-3 text-2xl font-semibold">{{ path === '/' ? 'home' : path }}</h1>
            <dl class="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                    <dt class="font-medium text-slate-500">Old Next.js source</dt>
                    <dd class="mt-1 rounded bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">{{ source }}</dd>
                </div>
                <div>
                    <dt class="font-medium text-slate-500">Route params</dt>
                    <dd class="mt-1 rounded bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">{{ JSON.stringify(params) }}</dd>
                </div>
            </dl>
            <p class="mt-6 text-sm leading-6 text-slate-600">
                This URL is reserved in Laravel/Vue so old navigation does not 404 during migration.
                Replace this shell with the native Vue page when the screen is ported.
            </p>
        </section>
    </main>
</template>
