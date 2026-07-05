<script setup>
import { Link, router, usePage } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import { groupedAdminMenu, adminMenu } from '@/lib/adminMenu';
import { API_BASE_URL } from '@/lib/apiClient';

const props = defineProps({
    title: { type: String, default: 'Dashboard' },
    source: { type: String, default: '' },
});

const page = usePage();
const collapsed = ref(false);
const menuGroups = groupedAdminMenu();
const currentPath = computed(() => page.url.split('?')[0]);
const admin = computed(() => page.props.admin || {});

function isActive(path) {
    return currentPath.value === path || (path !== '/admin' && currentPath.value.startsWith(`${path}/`));
}

function logout() {
    router.post('/logout');
}
</script>

<template>
    <div class="min-h-screen bg-slate-100 text-slate-900">
        <aside
            class="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-200"
            :class="collapsed ? 'w-[72px]' : 'w-72'"
        >
            <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">EF</div>
                <div v-if="!collapsed" class="min-w-0">
                    <p class="truncate text-sm font-bold">eFixMate</p>
                    <p class="text-xs text-slate-500">Admin panel</p>
                </div>
            </div>

            <nav class="flex-1 overflow-y-auto px-3 py-4">
                <section v-for="(items, group) in menuGroups" :key="group" class="mb-5">
                    <p v-if="!collapsed" class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ group }}</p>
                    <div class="space-y-1">
                        <Link
                            v-for="item in items"
                            :key="item.path"
                            :href="item.path"
                            class="group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition"
                            :class="isActive(item.path) ? 'bg-slate-900 font-semibold text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
                            :title="collapsed ? item.title : undefined"
                        >
                            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-white" :class="isActive(item.path) ? 'bg-white/15 text-white' : ''">
                                {{ item.title.slice(0, 2).toUpperCase() }}
                            </span>
                            <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
                        </Link>
                    </div>
                </section>
            </nav>

            <div class="border-t border-slate-200 p-3">
                <button @click="logout" class="flex w-full items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600">
                    <span v-if="!collapsed">Sign out</span>
                    <span v-else>SO</span>
                </button>
            </div>
        </aside>

        <div class="transition-all duration-200" :class="collapsed ? 'pl-[72px]' : 'pl-72'">
            <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
                <div class="flex min-w-0 items-center gap-3">
                    <button @click="collapsed = !collapsed" class="rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50">{{ collapsed ? 'Open' : 'Close' }}</button>
                    <div class="min-w-0">
                        <h1 class="truncate text-lg font-semibold">{{ title }}</h1>
                        <p class="truncate text-xs text-slate-500">{{ source || currentPath }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 text-sm text-slate-600">
                    <span class="hidden sm:inline">API: {{ API_BASE_URL }}</span>
                    <span class="rounded-full bg-slate-100 px-3 py-1">{{ admin.first_name || 'Admin' }}</span>
                </div>
            </header>

            <main class="p-6">
                <slot />
            </main>
        </div>
    </div>
</template>