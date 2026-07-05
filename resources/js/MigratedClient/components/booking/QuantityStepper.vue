<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="QuantityStepper"
        source="components/booking/QuantityStepper.tsx"
        area="component"
        :params="props.params"
    />
</template>