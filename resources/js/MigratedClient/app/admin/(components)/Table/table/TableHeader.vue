<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TableHeader"
        source="app/admin/(components)/Table/table/TableHeader.jsx"
        area="component"
        :params="props.params"
    />
</template>