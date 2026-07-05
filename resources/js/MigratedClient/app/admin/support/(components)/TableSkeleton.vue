<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TableSkeleton"
        source="app/admin/support/(components)/TableSkeleton.tsx"
        area="component"
        :params="props.params"
    />
</template>