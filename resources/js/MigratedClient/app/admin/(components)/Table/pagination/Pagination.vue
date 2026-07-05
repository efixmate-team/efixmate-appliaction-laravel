<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Pagination"
        source="app/admin/(components)/Table/pagination/Pagination.jsx"
        area="component"
        :params="props.params"
    />
</template>