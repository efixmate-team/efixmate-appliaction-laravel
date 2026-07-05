<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DateRange"
        source="app/admin/(components)/Forms/DateRange.jsx"
        area="component"
        :params="props.params"
    />
</template>