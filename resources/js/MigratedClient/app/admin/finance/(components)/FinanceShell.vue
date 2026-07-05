<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="FinanceShell"
        source="app/admin/finance/(components)/FinanceShell.tsx"
        area="component"
        :params="props.params"
    />
</template>