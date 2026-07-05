<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="PolygonPicker"
        source="app/admin/masters/geography/areas/_PolygonPicker.tsx"
        area="component"
        :params="props.params"
    />
</template>