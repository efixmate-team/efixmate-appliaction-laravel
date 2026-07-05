<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Layout"
        source="app/admin/support/layout.tsx"
        area="component"
        :params="props.params"
    />
</template>