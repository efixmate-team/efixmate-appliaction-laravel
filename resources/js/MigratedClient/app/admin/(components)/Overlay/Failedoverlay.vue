<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Failedoverlay"
        source="app/admin/(components)/Overlay/Failedoverlay.tsx"
        area="component"
        :params="props.params"
    />
</template>