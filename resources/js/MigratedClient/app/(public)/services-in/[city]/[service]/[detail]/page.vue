<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Page"
        source="app/(public)/services-in/[city]/[service]/[detail]/page.tsx"
        area="component"
        :params="props.params"
    />
</template>