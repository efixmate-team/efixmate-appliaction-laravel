<script setup>
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import BrandLogo from './BrandLogo.vue';

const props = defineProps({
    activePath: { type: String, default: '/' },
    area: { type: String, default: 'public' },
});

const open = ref(false);
const navItems = computed(() => {
    if (props.area === 'technician') {
        return [
            { label: 'Technician Home', href: '/technician' },
            { label: 'Login', href: '/technician/login' },
            { label: 'Register', href: '/technician/register' },
            { label: 'Support', href: '/contact-us' },
        ];
    }

    if (props.area === 'user') {
        return [
            { label: 'Services', href: '/services' },
            { label: 'Bookings', href: '/bookings' },
            { label: 'Offers', href: '/offers' },
            { label: 'Cart', href: '/cart' },
            { label: 'Profile', href: '/profile' },
        ];
    }

    return [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Services by City', href: '/services-in' },
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact Us', href: '/contact-us' },
    ];
});

function isActive(href) {
    return props.activePath === href || (href !== '/' && props.activePath.startsWith(href));
}
</script>

<template>
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex h-14 w-[92%] max-w-[1440px] items-center gap-3">
            <Link href="/" class="flex shrink-0 items-center gap-2" aria-label="eFixMate home">
                <BrandLogo :size="30" />
                <span class="hidden text-base font-bold text-slate-950 sm:block">eFixMate</span>
            </Link>

            <div class="flex-1" />

            <nav class="hidden items-center gap-1 lg:flex">
                <Link
                    v-for="item in navItems"
                    :key="item.href"
                    :href="item.href"
                    class="rounded-md px-3 py-2 text-sm font-medium transition"
                    :class="isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
                >
                    {{ item.label }}
                </Link>
            </nav>

            <Link
                href="/services"
                class="hidden rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 lg:inline-flex"
            >
                Book a Service
            </Link>

            <button
                type="button"
                class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
                @click="open = !open"
            >
                Menu
            </button>
        </div>

        <div v-if="open" class="border-t border-slate-200 bg-white px-5 py-3 lg:hidden">
            <div class="mx-auto flex w-[92%] max-w-[1440px] flex-col gap-1">
                <Link
                    v-for="item in navItems"
                    :key="item.href"
                    :href="item.href"
                    class="rounded-md px-3 py-2 text-sm font-semibold"
                    :class="isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-700'"
                    @click="open = false"
                >
                    {{ item.label }}
                </Link>
            </div>
        </div>
    </header>
</template>
