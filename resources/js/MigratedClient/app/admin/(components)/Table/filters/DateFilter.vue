<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DateFilter"
        source="app/admin/(components)/Table/filters/DateFilter.jsx"
        area="component"
        :params="props.params"
    />
</template>