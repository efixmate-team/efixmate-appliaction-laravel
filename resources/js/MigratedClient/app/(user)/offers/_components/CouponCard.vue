<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="CouponCard"
        source="app/(user)/offers/_components/CouponCard.tsx"
        area="component"
        :params="props.params"
    />
</template>