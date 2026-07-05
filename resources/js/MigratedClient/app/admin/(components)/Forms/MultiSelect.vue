<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="MultiSelect"
        source="app/admin/(components)/Forms/MultiSelect.jsx"
        area="component"
        :params="props.params"
    />
</template>