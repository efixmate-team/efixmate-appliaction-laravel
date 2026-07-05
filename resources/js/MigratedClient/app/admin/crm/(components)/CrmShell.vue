<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="CrmShell"
        source="app/admin/crm/(components)/CrmShell.tsx"
        area="component"
        :params="props.params"
    />
</template>