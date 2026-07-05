<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BulkUploadModal"
        source="app/admin/(components)/BulkUploadModal.tsx"
        area="component"
        :params="props.params"
    />
</template>