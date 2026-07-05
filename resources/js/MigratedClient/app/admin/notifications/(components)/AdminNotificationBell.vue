<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="AdminNotificationBell"
        source="app/admin/notifications/(components)/AdminNotificationBell.tsx"
        area="component"
        :params="props.params"
    />
</template>