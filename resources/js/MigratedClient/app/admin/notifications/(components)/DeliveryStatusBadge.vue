<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DeliveryStatusBadge"
        source="app/admin/notifications/(components)/DeliveryStatusBadge.tsx"
        area="component"
        :params="props.params"
    />
</template>