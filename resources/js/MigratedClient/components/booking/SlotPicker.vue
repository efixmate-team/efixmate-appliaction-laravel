<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="SlotPicker"
        source="components/booking/SlotPicker.tsx"
        area="component"
        :params="props.params"
    />
</template>