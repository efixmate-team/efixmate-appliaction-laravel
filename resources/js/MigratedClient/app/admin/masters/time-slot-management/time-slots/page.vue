<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Page"
        source="app/admin/masters/time-slot-management/time-slots/page.tsx"
        area="component"
        :params="props.params"
    />
</template>