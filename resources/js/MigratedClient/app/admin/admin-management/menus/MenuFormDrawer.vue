<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="MenuFormDrawer"
        source="app/admin/admin-management/menus/MenuFormDrawer.tsx"
        area="component"
        :params="props.params"
    />
</template>