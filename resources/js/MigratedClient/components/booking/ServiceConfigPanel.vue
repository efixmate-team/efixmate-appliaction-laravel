<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ServiceConfigPanel"
        source="components/booking/ServiceConfigPanel.tsx"
        area="component"
        :params="props.params"
    />
</template>