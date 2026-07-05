<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="SecurityShell"
        source="app/admin/security/(components)/SecurityShell.tsx"
        area="component"
        :params="props.params"
    />
</template>