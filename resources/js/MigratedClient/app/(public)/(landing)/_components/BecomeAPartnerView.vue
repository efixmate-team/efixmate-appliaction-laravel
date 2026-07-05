<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="BecomeAPartnerView"
        source="app/(public)/(landing)/_components/BecomeAPartnerView.tsx"
        area="component"
        :params="props.params"
    />
</template>