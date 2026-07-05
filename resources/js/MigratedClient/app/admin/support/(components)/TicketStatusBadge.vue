<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TicketStatusBadge"
        source="app/admin/support/(components)/TicketStatusBadge.tsx"
        area="component"
        :params="props.params"
    />
</template>