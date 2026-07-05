<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="StepUpDialog"
        source="src/features/security/components/StepUpDialog.tsx"
        area="component"
        :params="props.params"
    />
</template>