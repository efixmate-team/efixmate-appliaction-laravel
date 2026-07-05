<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ServicesPageView"
        source="app/(public)/services/ServicesPageView.tsx"
        area="component"
        :params="props.params"
    />
</template>