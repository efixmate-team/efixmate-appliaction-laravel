<script setup>
defineProps({
    source: { type: String, required: true },
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p class="font-semibold">Native Vue page shell is active. Detailed React logic still needs component-level porting.</p>
        <p class="mt-2 break-all font-mono text-xs">{{ source }}</p>
        <pre v-if="Object.keys(params).length" class="mt-2 overflow-auto text-xs">{{ JSON.stringify(params, null, 2) }}</pre>
    </div>
</template>
