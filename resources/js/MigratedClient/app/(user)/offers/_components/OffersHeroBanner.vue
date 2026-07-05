<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="OffersHeroBanner"
        source="app/(user)/offers/_components/OffersHeroBanner.tsx"
        area="component"
        :params="props.params"
    />
</template>