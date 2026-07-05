<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="AsyncSelect"
        source="app/admin/(components)/Forms/AsyncSelect.jsx"
        area="component"
        :params="props.params"
    />
</template>