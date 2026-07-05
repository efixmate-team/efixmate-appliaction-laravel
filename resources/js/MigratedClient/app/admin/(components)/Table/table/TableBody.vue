<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TableBody"
        source="app/admin/(components)/Table/table/TableBody.jsx"
        area="component"
        :params="props.params"
    />
</template>