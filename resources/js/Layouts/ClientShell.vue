<script setup>
import PublicHeader from '@/Components/Client/PublicHeader.vue';
import SiteFooter from '@/Components/Client/SiteFooter.vue';

defineProps({
    title: { type: String, required: true },
    area: { type: String, default: 'public' },
    path: { type: String, default: '/' },
    source: { type: String, default: '' },
});
</script>

<template>
    <div class="min-h-screen bg-white text-slate-950">
        <PublicHeader :active-path="path === '/' ? '/' : `/${path}`" :area="area" />
        <main>
            <slot />
        </main>
        <SiteFooter />
    </div>
</template>
