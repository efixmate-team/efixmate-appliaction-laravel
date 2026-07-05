<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="NumberStepper"
        source="app/admin/(components)/Forms/NumberStepper.jsx"
        area="component"
        :params="props.params"
    />
</template>