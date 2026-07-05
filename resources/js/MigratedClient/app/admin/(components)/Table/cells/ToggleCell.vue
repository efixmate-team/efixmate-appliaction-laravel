<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ToggleCell"
        source="app/admin/(components)/Table/cells/ToggleCell.jsx"
        area="component"
        :params="props.params"
    />
</template>