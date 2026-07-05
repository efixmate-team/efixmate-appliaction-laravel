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
        <div class="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[260px_1fr]">
            <aside class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                <nav class="mt-4 space-y-1 text-sm">
                    <a href="/bookings" class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Bookings</a>
                    <a href="/cart" class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Cart</a>
                    <a href="/offers" class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Offers</a>
                    <a href="/profile" class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Profile</a>
                </nav>
            </aside>
            <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">User app</p>
                <h1 class="mt-2 text-2xl font-semibold text-slate-950">{{ title }}</h1>
                <p class="mt-2 text-sm text-slate-600">Customer route is now mounted in Vue/Inertia and ready for full workflow porting.</p>
                <div class="mt-6">
                    <MigrationNotice :source="source" :params="params" />
                </div>
            </div>
        </div>
    </section>
</template>
