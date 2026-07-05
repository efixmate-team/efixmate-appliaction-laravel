<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ChipsCell"
        source="app/admin/(components)/Table/cells/ChipsCell.jsx"
        area="component"
        :params="props.params"
    />
</template>