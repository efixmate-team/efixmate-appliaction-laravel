<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BookingTimeline"
        source="app/admin/booking-management/workflow/(components)/BookingTimeline.tsx"
        area="component"
        :params="props.params"
    />
</template>