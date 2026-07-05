<script setup>
import { Link } from '@inertiajs/vue3';
import { ChevronDown } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { resolveIcon } from './iconMap';

const props = defineProps({
    menu: { type: Object, required: true },
    activeCheck: { type: Function, required: true },
    collapsed: { type: Boolean, required: true },
});

const children = computed(() => props.menu.children ?? []);
const hasChildren = computed(() => children.value.length > 0);
const anyChildActive = computed(() => children.value.some((c) => props.activeCheck(c.menu_path)));

const open = ref(anyChildActive.value);
watch(anyChildActive, (v) => { open.value = v; });

const isHovered = ref(false);
const menuPos = ref({ top: 0, left: 0 });
const buttonRef = ref(null);

function toggle() {
    if (!props.collapsed && hasChildren.value) {
        open.value = !open.value;
    }
}

function handleMouseEnter() {
    if (props.collapsed && buttonRef.value) {
        const rect = buttonRef.value.getBoundingClientRect();
        menuPos.value = { top: rect.top, left: rect.right + 10 };
        isHovered.value = true;
    }
}
</script>

<template>
    <div @mouseenter="handleMouseEnter" @mouseleave="isHovered = false">
        <button
            ref="buttonRef"
            @click="toggle"
            :disabled="!hasChildren && !collapsed"
            :title="(collapsed && !hasChildren) ? menu.menu_name : undefined"
            class="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 select-none"
            :class="[
                anyChildActive ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold' : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]',
                (!hasChildren && !collapsed) ? 'cursor-default' : '',
            ]"
        >
            <component
                :is="resolveIcon(menu.menu_icon)"
                class="w-[18px] h-[18px] shrink-0"
                :class="anyChildActive ? 'text-[#0f172a]' : 'text-[#94a3b8] group-hover:text-[#475569]'"
            />

            <template v-if="!collapsed">
                <span class="flex-1 text-left text-[13.5px] leading-none truncate">{{ menu.menu_name }}</span>
                <ChevronDown
                    v-if="hasChildren"
                    class="w-4 h-4 shrink-0 transition-transform duration-300"
                    :class="[open ? 'rotate-180' : '', anyChildActive ? 'text-[#0f172a]' : 'text-[#94a3b8]']"
                />
            </template>

            <div
                v-if="collapsed && isHovered"
                class="fixed z-[9999] bg-[#ffffff] border border-[#f1f5f9] rounded-2xl shadow-2xl shadow-[#e2e8f0]/50 py-2.5 min-w-[180px] duration-200"
                :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
            >
                <div class="absolute top-0 -left-4 w-4 h-full" />
                <div class="px-4 py-2 border-b border-[#f8fafc] mb-1.5">
                    <span class="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">{{ menu.menu_name }}</span>
                </div>
                <div class="px-1.5 space-y-0.5">
                    <template v-if="hasChildren">
                        <Link
                            v-for="child in children"
                            :key="child.menu_id"
                            :href="child.menu_path"
                            class="group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 select-none"
                            :class="activeCheck(child.menu_path) ? 'bg-[#0f172a] text-white font-semibold' : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'"
                        >
                            <component
                                :is="resolveIcon(child.menu_icon)"
                                class="w-3.5 h-3.5 shrink-0"
                                :class="activeCheck(child.menu_path) ? 'text-white' : 'text-[#94a3b8] group-hover:text-[#475569]'"
                            />
                            <span class="text-[13px] leading-none truncate">{{ child.menu_name }}</span>
                            <div v-if="activeCheck(child.menu_path)" class="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        </Link>
                    </template>
                    <div v-else class="px-3 py-2 text-[12px] italic text-[#94a3b8] select-none">No child items</div>
                </div>
            </div>
        </button>

        <div
            v-if="!collapsed"
            class="overflow-hidden transition-all duration-300 ease-in-out"
            :class="(open || !hasChildren) ? 'max-h-[600px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'"
        >
            <div class="ml-4 pl-4 border-l-2 border-[#e2e8f0] space-y-0.5 py-0.5">
                <template v-if="hasChildren">
                    <Link
                        v-for="child in children"
                        :key="child.menu_id"
                        :href="child.menu_path"
                        :data-sidebar-active="activeCheck(child.menu_path) ? 'true' : undefined"
                        class="group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 select-none"
                        :class="activeCheck(child.menu_path) ? 'bg-[#0f172a] text-white font-semibold shadow-sm' : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]'"
                    >
                        <component
                            :is="resolveIcon(child.menu_icon)"
                            class="w-3.5 h-3.5 shrink-0"
                            :class="activeCheck(child.menu_path) ? 'text-white' : 'text-[#94a3b8] group-hover:text-[#475569]'"
                        />
                        <span class="text-[13px] leading-none truncate">{{ child.menu_name }}</span>
                        <span v-if="activeCheck(child.menu_path)" class="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                    </Link>
                </template>
                <div v-else class="px-3 py-2 text-[12px] italic text-[#94a3b8] select-none">No child</div>
            </div>
        </div>
    </div>
</template>
