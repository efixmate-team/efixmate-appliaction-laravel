<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="LandingSubPage"
        source="app/(public)/(landing)/_components/LandingSubPage.tsx"
        area="component"
        :params="props.params"
    />
</template>