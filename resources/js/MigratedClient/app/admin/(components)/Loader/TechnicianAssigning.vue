<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="TechnicianAssigning"
        source="app/admin/(components)/Loader/TechnicianAssigning.tsx"
        area="component"
        :params="props.params"
    />
</template>