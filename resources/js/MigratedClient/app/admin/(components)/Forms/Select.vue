<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Select"
        source="app/admin/(components)/Forms/Select.jsx"
        area="component"
        :params="props.params"
    />
</template>