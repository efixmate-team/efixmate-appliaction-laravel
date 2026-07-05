<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DispatchModal"
        source="app/admin/booking-management/workflow/(components)/DispatchModal.tsx"
        area="component"
        :params="props.params"
    />
</template>