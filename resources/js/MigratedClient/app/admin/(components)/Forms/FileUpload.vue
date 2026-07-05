<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="FileUpload"
        source="app/admin/(components)/Forms/FileUpload.jsx"
        area="component"
        :params="props.params"
    />
</template>