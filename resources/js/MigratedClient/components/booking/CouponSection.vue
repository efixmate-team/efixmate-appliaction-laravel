<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="CouponSection"
        source="components/booking/CouponSection.tsx"
        area="component"
        :params="props.params"
    />
</template>