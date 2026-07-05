<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Filters"
        source="app/admin/(components)/Table/table/Filters.jsx"
        area="component"
        :params="props.params"
    />
</template>