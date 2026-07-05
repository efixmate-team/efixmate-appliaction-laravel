<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="RadioGroup"
        source="app/admin/(components)/Forms/RadioGroup.jsx"
        area="component"
        :params="props.params"
    />
</template>