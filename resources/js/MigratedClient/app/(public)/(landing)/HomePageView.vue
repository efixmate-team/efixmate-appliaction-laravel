<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="HomePageView"
        source="app/(public)/(landing)/HomePageView.tsx"
        area="component"
        :params="props.params"
    />
</template>