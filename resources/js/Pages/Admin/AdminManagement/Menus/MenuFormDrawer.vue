<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    open: Boolean,
    mode: { type: String, default: 'create' }, // 'create' | 'edit'
    menu: { type: Object, default: null },
    parents: { type: Array, default: () => [] },
    groups: { type: Array, default: () => [] },
    saving: Boolean,
});
const emit = defineEmits(['close', 'submit']);

const placement = ref('I'); // I | P | C
const values = ref({ menu_name: '', menu_path: '', menu_icon: '', menu_parent_id: '', menu_group_id: '', new_group_name: '', is_active: true });
const useNewGroup = ref(false);

watch(() => props.open, (isOpen) => {
    if (!isOpen) return;
    if (props.mode === 'edit' && props.menu) {
        values.value = {
            menu_name: props.menu.menu_name || '', menu_path: props.menu.menu_path || '',
            menu_icon: props.menu.menu_icon || '', menu_parent_id: props.menu.menu_parent_id || '',
            menu_group_id: props.menu.menu_group_id || '', new_group_name: '', is_active: !!props.menu.is_active,
        };
        placement.value = props.menu.menu_type || 'I';
    } else {
        values.value = { menu_name: '', menu_path: '', menu_icon: '', menu_parent_id: '', menu_group_id: '', new_group_name: '', is_active: true };
        placement.value = 'I';
        useNewGroup.value = false;
    }
});

function submit() {
    const payload = { ...values.value, menu_type: placement.value };
    if (placement.value === 'P' && !payload.menu_path) payload.menu_path = '#';
    if (useNewGroup.value && payload.new_group_name) {
        payload.menu_group = payload.new_group_name;
        payload.menu_group_id = null;
    } else {
        const found = props.groups.find((g) => String(g.id) === String(payload.menu_group_id));
        payload.menu_group = found?.label || null;
    }
    emit('submit', payload);
}
</script>

<template>
    <div v-if="open" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
        <aside class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div class="border-b border-slate-200 p-5">
                <h3 class="text-base font-semibold text-slate-950">{{ mode === 'create' ? 'Add menu' : 'Edit menu' }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ mode === 'create' ? 'Add a new item to the admin sidebar.' : 'Update this menu item.' }}</p>
            </div>

            <div class="flex-1 space-y-4 overflow-y-auto p-5">
                <div>
                    <label class="block text-xs font-medium text-slate-600">Menu name *</label>
                    <input v-model="values.menu_name" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>

                <div v-if="mode === 'create'">
                    <label class="block text-xs font-medium text-slate-600">Type</label>
                    <div class="mt-2 space-y-2">
                        <label class="flex items-start gap-2 text-sm">
                            <input type="radio" value="I" v-model="placement" class="mt-1" />
                            <span><span class="font-medium">Regular menu link</span><br /><span class="text-xs text-slate-500">A normal clickable sidebar item.</span></span>
                        </label>
                        <label class="flex items-start gap-2 text-sm">
                            <input type="radio" value="P" v-model="placement" class="mt-1" />
                            <span><span class="font-medium">Section heading</span><br /><span class="text-xs text-slate-500">A non-clickable group header.</span></span>
                        </label>
                        <label class="flex items-start gap-2 text-sm">
                            <input type="radio" value="C" v-model="placement" class="mt-1" />
                            <span><span class="font-medium">Sub-menu item</span><br /><span class="text-xs text-slate-500">Nested under a section heading.</span></span>
                        </label>
                    </div>
                </div>
                <p v-else class="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">Type and sidebar section are set at creation and cannot be changed here.</p>

                <div v-if="mode === 'create' && placement === 'C'">
                    <label class="block text-xs font-medium text-slate-600">Under which section? *</label>
                    <select v-model="values.menu_parent_id" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Select a section</option>
                        <option v-for="p in parents" :key="p.id" :value="p.id">{{ p.label }}</option>
                    </select>
                </div>

                <div v-if="mode === 'create'">
                    <label class="block text-xs font-medium text-slate-600">Sidebar section *</label>
                    <select v-if="!useNewGroup" v-model="values.menu_group_id" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Select a section</option>
                        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.label }}</option>
                    </select>
                    <input v-else v-model="values.new_group_name" required placeholder="New section name" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    <button type="button" @click="useNewGroup = !useNewGroup" class="mt-1 text-xs font-medium text-indigo-600 hover:underline">
                        {{ useNewGroup ? 'Choose existing section instead' : '+ Add a new sidebar section' }}
                    </button>
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600">Path {{ placement !== 'P' ? '*' : '' }}</label>
                    <input v-model="values.menu_path" :required="placement !== 'P'" placeholder="/admin/..." class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-600">Icon</label>
                    <input v-model="values.menu_icon" placeholder="LayoutGrid" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>

                <label class="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" v-model="values.is_active" /> Active
                </label>
            </div>

            <div class="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button @click="emit('close')" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button @click="submit" :disabled="saving" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {{ saving ? 'Saving...' : (mode === 'create' ? 'Add menu' : 'Save changes') }}
                </button>
            </div>
        </aside>
    </div>
</template>
