<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ActivityTimeline"
        source="app/admin/crm/(components)/ActivityTimeline.tsx"
        area="component"
        :params="props.params"
    />
</template>