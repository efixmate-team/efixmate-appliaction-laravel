<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="FormInput"
        source="components/forms/FormInput.tsx"
        area="component"
        :params="props.params"
    />
</template>