<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DeliveryTable"
        source="app/admin/notifications/(components)/DeliveryTable.tsx"
        area="component"
        :params="props.params"
    />
</template>