<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ServiceAddModal"
        source="components/booking/ServiceAddModal.tsx"
        area="component"
        :params="props.params"
    />
</template>