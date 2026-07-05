<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Paginatedtable"
        source="app/admin/(components)/Table/Paginatedtable.jsx"
        area="component"
        :params="props.params"
    />
</template>