<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="AboutPageView"
        source="app/(public)/(landing)/(company)/about-us/AboutPageView.tsx"
        area="component"
        :params="props.params"
    />
</template>