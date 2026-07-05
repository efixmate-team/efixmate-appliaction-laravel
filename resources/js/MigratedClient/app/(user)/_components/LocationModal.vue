<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="LocationModal"
        source="app/(user)/_components/LocationModal.tsx"
        area="component"
        :params="props.params"
    />
</template>