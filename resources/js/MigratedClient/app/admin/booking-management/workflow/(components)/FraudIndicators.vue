<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="FraudIndicators"
        source="app/admin/booking-management/workflow/(components)/FraudIndicators.tsx"
        area="component"
        :params="props.params"
    />
</template>