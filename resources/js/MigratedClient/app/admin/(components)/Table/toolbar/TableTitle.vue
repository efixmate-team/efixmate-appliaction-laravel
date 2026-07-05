<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TableTitle"
        source="app/admin/(components)/Table/toolbar/TableTitle.jsx"
        area="component"
        :params="props.params"
    />
</template>