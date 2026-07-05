<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ExportMenu"
        source="app/admin/(components)/Table/toolbar/ExportMenu.jsx"
        area="component"
        :params="props.params"
    />
</template>