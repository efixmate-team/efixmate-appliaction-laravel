<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BrandLogo"
        source="components/BrandLogo.tsx"
        area="component"
        :params="props.params"
    />
</template>