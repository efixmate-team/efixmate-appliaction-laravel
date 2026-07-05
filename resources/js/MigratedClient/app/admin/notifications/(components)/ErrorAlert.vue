<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ErrorAlert"
        source="app/admin/notifications/(components)/ErrorAlert.tsx"
        area="component"
        :params="props.params"
    />
</template>