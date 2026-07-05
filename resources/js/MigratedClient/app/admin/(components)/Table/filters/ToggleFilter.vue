<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ToggleFilter"
        source="app/admin/(components)/Table/filters/ToggleFilter.jsx"
        area="component"
        :params="props.params"
    />
</template>