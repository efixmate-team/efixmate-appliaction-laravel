<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Input"
        source="app/admin/(components)/Forms/Input.jsx"
        area="component"
        :params="props.params"
    />
</template>