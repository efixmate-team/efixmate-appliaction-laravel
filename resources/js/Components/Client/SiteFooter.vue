<script setup>
import { Link } from '@inertiajs/vue3';
import BrandLogo from './BrandLogo.vue';

const sections = [
    {
        title: 'Services',
        links: [
            ['AC Service & Repair', '/services'],
            ['Electrician', '/services'],
            ['Plumbing', '/services'],
            ['Appliance Repair', '/services'],
            ['Home Cleaning', '/services'],
        ],
    },
    {
        title: 'Company',
        links: [
            ['About Us', '/about-us'],
            ['Contact Us', '/contact-us'],
            ['Become a Partner', '/become-a-partner'],
            ['FAQ', '/faq'],
        ],
    },
    {
        title: 'Legal',
        links: [
            ['Terms & Conditions', '/terms-and-conditions'],
            ['Privacy Policy', '/privacy-policy'],
            ['Refund Policy', '/refund-policy'],
            ['Warranty Policy', '/warranty-policy'],
        ],
    },
];
</script>

<template>
    <footer class="bg-slate-950 text-slate-300">
        <div class="mx-auto grid w-[92%] max-w-[1440px] gap-10 py-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
                <Link href="/" class="flex items-center gap-3">
                    <BrandLogo variant="onDark" />
                    <span class="text-lg font-black text-white">eFixMate</span>
                </Link>
                <p class="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                    India's trusted services marketplace for homes, offices and workplaces with verified professionals,
                    transparent pricing and dependable support.
                </p>
                <div class="mt-5 space-y-1 text-sm text-slate-400">
                    <p>Near DM Tower, Kailash Nagar, Birgaon, Raipur, CG 490013</p>
                    <p>+91 6266 100 099</p>
                    <p>support@efixmate.com</p>
                </div>
            </div>

            <div v-for="section in sections" :key="section.title">
                <h3 class="text-xs font-bold uppercase tracking-wider text-blue-300">{{ section.title }}</h3>
                <ul class="mt-4 space-y-2">
                    <li v-for="[label, href] in section.links" :key="label">
                        <Link :href="href" class="text-sm text-slate-400 hover:text-white">{{ label }}</Link>
                    </li>
                </ul>
            </div>
        </div>

        <div class="border-t border-white/10">
            <div class="mx-auto flex w-[92%] max-w-[1440px] flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>© {{ new Date().getFullYear() }} eFixMate Pvt. Ltd. All rights reserved.</span>
                <span>Made in India</span>
            </div>
        </div>
    </footer>
</template>
