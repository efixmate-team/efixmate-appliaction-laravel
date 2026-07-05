<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BookingsPanel"
        source="app/admin/crm/customers/[customerId]/(components)/BookingsPanel.tsx"
        area="component"
        :params="props.params"
    />
</template>