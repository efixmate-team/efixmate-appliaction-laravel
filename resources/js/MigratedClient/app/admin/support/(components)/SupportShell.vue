<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="SupportShell"
        source="app/admin/support/(components)/SupportShell.tsx"
        area="component"
        :params="props.params"
    />
</template>