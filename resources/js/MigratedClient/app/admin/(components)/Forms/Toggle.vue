<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Toggle"
        source="app/admin/(components)/Forms/Toggle.jsx"
        area="component"
        :params="props.params"
    />
</template>