<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="LinePhotoUpload"
        source="components/booking/LinePhotoUpload.tsx"
        area="component"
        :params="props.params"
    />
</template>