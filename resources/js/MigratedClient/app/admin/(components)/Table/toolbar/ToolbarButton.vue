<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ToolbarButton"
        source="app/admin/(components)/Table/toolbar/ToolbarButton.jsx"
        area="component"
        :params="props.params"
    />
</template>