<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Successoverlay"
        source="app/admin/(components)/Overlay/Successoverlay.tsx"
        area="component"
        :params="props.params"
    />
</template>