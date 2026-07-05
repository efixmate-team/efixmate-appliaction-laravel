<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ScopeSelector"
        source="app/admin/masters/announcement-management/ScopeSelector.tsx"
        area="component"
        :params="props.params"
    />
</template>