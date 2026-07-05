<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TicketTimeline"
        source="app/admin/support/(components)/TicketTimeline.tsx"
        area="component"
        :params="props.params"
    />
</template>