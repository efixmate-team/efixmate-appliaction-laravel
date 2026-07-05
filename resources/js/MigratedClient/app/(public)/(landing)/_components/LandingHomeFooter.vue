<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="LandingHomeFooter"
        source="app/(public)/(landing)/_components/LandingHomeFooter.tsx"
        area="component"
        :params="props.params"
    />
</template>