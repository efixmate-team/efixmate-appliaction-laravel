<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DropdownFilter"
        source="app/admin/(components)/Table/filters/DropdownFilter.jsx"
        area="component"
        :params="props.params"
    />
</template>