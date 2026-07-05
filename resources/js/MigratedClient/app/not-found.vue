<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Not Found"
        source="app/not-found.tsx"
        area="component"
        :params="props.params"
    />
</template>