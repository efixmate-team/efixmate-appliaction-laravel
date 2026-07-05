<script setup>
import MigrationFrame from '@/MigratedClient/shared/MigrationFrame.vue';

const props = defineProps({
    params: { type: Object, default: () => ({}) },
});
</script>

<template>
    <MigrationFrame
        title="Form"
        source="app/admin/(components)/Forms/Form.jsx"
        area="component"
        :params="props.params"
    />
</template>