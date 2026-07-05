<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="PriceBreakdown"
        source="components/booking/PriceBreakdown.tsx"
        area="component"
        :params="props.params"
    />
</template>