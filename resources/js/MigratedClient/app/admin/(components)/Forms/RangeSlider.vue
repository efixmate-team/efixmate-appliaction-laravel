<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="RangeSlider"
        source="app/admin/(components)/Forms/RangeSlider.jsx"
        area="component"
        :params="props.params"
    />
</template>