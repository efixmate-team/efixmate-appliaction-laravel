<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Column"
        source="app/admin/(components)/Table/table/Column.jsx"
        area="component"
        :params="props.params"
    />
</template>