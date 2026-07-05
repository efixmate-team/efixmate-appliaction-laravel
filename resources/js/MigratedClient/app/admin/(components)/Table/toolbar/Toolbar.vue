<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Toolbar"
        source="app/admin/(components)/Table/toolbar/Toolbar.jsx"
        area="component"
        :params="props.params"
    />
</template>