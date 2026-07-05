<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="AreasMap"
        source="app/admin/masters/geography/areas/map/_AreasMap.tsx"
        area="component"
        :params="props.params"
    />
</template>