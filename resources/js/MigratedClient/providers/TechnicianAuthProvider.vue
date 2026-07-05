<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TechnicianAuthProvider"
        source="providers/TechnicianAuthProvider.tsx"
        area="component"
        :params="props.params"
    />
</template>