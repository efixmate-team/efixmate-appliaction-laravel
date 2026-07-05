<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ServiceCatalogCard"
        source="app/admin/user-management/users/[customerId]/_ServiceCatalogCard.tsx"
        area="component"
        :params="props.params"
    />
</template>