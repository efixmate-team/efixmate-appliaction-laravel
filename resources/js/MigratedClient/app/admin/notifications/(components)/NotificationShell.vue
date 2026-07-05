<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="NotificationShell"
        source="app/admin/notifications/(components)/NotificationShell.tsx"
        area="component"
        :params="props.params"
    />
</template>