<script setup>
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import { resolveIcon } from './iconMap';

const props = defineProps({
    menu: { type: Object, required: true },
    isActive: { type: Boolean, required: true },
    collapsed: { type: Boolean, required: true },
});

const isHovered = ref(false);
const menuPos = ref({ top: 0, left: 0 });
const linkRef = ref(null);

function handleMouseEnter() {
    if (props.collapsed && linkRef.value) {
        const el = linkRef.value.$el ?? linkRef.value;
        const rect = el.getBoundingClientRect();
        menuPos.value = { top: rect.top, left: rect.right + 10 };
        isHovered.value = true;
    }
}
</script>

<template>
    <div @mouseenter="handleMouseEnter" @mouseleave="isHovered = false">
        <Link
            ref="linkRef"
            :href="menu.menu_path"
            :data-sidebar-active="isActive ? 'true' : undefined"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 select-none"
            :class="isActive ? 'bg-[#0f172a] text-white shadow-sm' : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'"
        >
            <component
                :is="resolveIcon(menu.menu_icon)"
                class="w-[18px] h-[18px] shrink-0 transition-colors"
                :class="isActive ? 'text-white' : 'text-[#94a3b8] group-hover:text-[#475569]'"
            />

            <span v-if="!collapsed" class="text-[13.5px] leading-none truncate" :class="isActive ? 'font-semibold' : ''">
                {{ menu.menu_name }}
            </span>

            <span v-if="collapsed && isActive" class="absolute right-1.5 top-1.5 w-2 h-2 bg-white rounded-full shadow" />

            <div
                v-if="collapsed && isHovered"
                class="fixed z-[9999] bg-[#ffffff] border border-[#f1f5f9] rounded-xl shadow-2xl shadow-[#e2e8f0]/50 px-4 py-2.5 duration-200"
                :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
            >
                <div class="absolute top-0 -left-4 w-4 h-full" />
                <span class="text-[13px] font-bold text-[#0f172a] whitespace-nowrap">{{ menu.menu_name }}</span>
            </div>
        </Link>
    </div>
</template>
