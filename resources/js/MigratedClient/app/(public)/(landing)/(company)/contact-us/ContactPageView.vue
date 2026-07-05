<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="ContactPageView"
        source="app/(public)/(landing)/(company)/contact-us/ContactPageView.tsx"
        area="component"
        :params="props.params"
    />
</template>