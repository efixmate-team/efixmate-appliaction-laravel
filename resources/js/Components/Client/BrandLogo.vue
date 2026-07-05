<script setup>
defineProps({
    variant: { type: String, default: 'default' },
    size: { type: Number, default: 40 },
});
</script>

<template>
    <span
        class="inline-flex shrink-0 items-center justify-center overflow-hidden"
        :class="variant === 'onDark' ? 'h-12 w-12 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/20' : ''"
        :style="variant === 'onDark' ? undefined : { width: `${size}px`, height: `${size}px` }"
    >
        <img src="/client/asssets/efixmate-logo.webp" alt="eFixMate" class="h-full w-full object-contain" />
    </span>
</template>
