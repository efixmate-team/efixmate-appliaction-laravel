<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="StatusCell"
        source="app/admin/(components)/Table/cells/StatusCell.jsx"
        area="component"
        :params="props.params"
    />
</template>