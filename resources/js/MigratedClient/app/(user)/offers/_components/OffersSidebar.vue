<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="OffersSidebar"
        source="app/(user)/offers/_components/OffersSidebar.tsx"
        area="component"
        :params="props.params"
    />
</template>