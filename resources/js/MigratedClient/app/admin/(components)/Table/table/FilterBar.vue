<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="FilterBar"
        source="app/admin/(components)/Table/table/FilterBar.jsx"
        area="component"
        :params="props.params"
    />
</template>