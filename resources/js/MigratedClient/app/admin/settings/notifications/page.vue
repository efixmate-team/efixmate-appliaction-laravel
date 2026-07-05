<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Page"
        source="app/admin/settings/notifications/page.tsx"
        area="component"
        :params="props.params"
    />
</template>