<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="EmptyState"
        source="app/admin/notifications/(components)/EmptyState.tsx"
        area="component"
        :params="props.params"
    />
</template>