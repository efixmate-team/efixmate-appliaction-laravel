<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BookingShell"
        source="app/admin/booking-management/workflow/(components)/BookingShell.tsx"
        area="component"
        :params="props.params"
    />
</template>