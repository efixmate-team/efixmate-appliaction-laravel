<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TrustBar"
        source="components/booking/TrustBar.tsx"
        area="component"
        :params="props.params"
    />
</template>