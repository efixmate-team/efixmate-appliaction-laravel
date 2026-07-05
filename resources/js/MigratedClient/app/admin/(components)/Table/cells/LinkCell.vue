<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="LinkCell"
        source="app/admin/(components)/Table/cells/LinkCell.jsx"
        area="component"
        :params="props.params"
    />
</template>