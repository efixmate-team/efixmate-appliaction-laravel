<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="DateRangeFilter"
        source="app/admin/finance/(components)/DateRangeFilter.tsx"
        area="component"
        :params="props.params"
    />
</template>