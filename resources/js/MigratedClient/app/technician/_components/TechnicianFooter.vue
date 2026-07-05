<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TechnicianFooter"
        source="app/technician/_components/TechnicianFooter.tsx"
        area="component"
        :params="props.params"
    />
</template>